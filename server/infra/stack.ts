// Pay-per-request only: DynamoDB on-demand, Lambda, API Gateway WebSocket, S3 + CloudFront. No always-on cost.
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import { WebSocketLambdaIntegration, HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as path from "node:path";

export class SteadyUpStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "Data", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const wsFn = new NodejsFunction(this, "WsHandler", {
      entry: path.join(import.meta.dirname, "../src/handler.ts"),
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: cdk.Duration.seconds(15),
      environment: { TABLE: table.tableName },
      bundling: { minify: true, externalModules: ["@aws-sdk/*"] },
    });
    table.grantReadWriteData(wsFn);

    // HTTP API: TV records finished sets (counts only); family page and TV read the weekly summary.
    const apiFn = new NodejsFunction(this, "ApiHandler", {
      entry: path.join(import.meta.dirname, "../src/api.ts"),
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: { TABLE: table.tableName },
      bundling: { minify: true, externalModules: ["@aws-sdk/*"] },
    });
    table.grantReadWriteData(apiFn);
    const httpApi = new apigw.HttpApi(this, "Api", {
      corsPreflight: { allowOrigins: ["*"], allowMethods: [apigw.CorsHttpMethod.GET, apigw.CorsHttpMethod.POST], allowHeaders: ["content-type"] },
    });
    const apiInteg = new HttpLambdaIntegration("ApiInteg", apiFn);
    httpApi.addRoutes({ path: "/sets", methods: [apigw.HttpMethod.POST], integration: apiInteg });
    httpApi.addRoutes({ path: "/summary", methods: [apigw.HttpMethod.GET], integration: apiInteg });

    const integ = new WebSocketLambdaIntegration("Ws", wsFn);
    const wsApi = new apigw.WebSocketApi(this, "Socket", {
      connectRouteOptions: { integration: integ },
      disconnectRouteOptions: { integration: integ },
      defaultRouteOptions: { integration: integ },
    });
    const stage = new apigw.WebSocketStage(this, "Live", { webSocketApi: wsApi, stageName: "live", autoDeploy: true });
    wsApi.grantManageConnections(wsFn);

    const bucket = new s3.Bucket(this, "Site", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const cdn = new cloudfront.Distribution(this, "Cdn", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // demo: always fresh; no invalidation needed
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });
    new s3deploy.BucketDeployment(this, "DeploySite", {
      sources: [
        s3deploy.Source.asset(path.join(import.meta.dirname, "../../web/dist")),
        s3deploy.Source.jsonData("config.json", { wsUrl: stage.url, apiUrl: httpApi.apiEndpoint }), // runtime config: the page reads it, no rebuild per deploy
      ],
      destinationBucket: bucket,
      distribution: cdn,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "WsUrl", { value: stage.url });
    new cdk.CfnOutput(this, "WebUrl", { value: `https://${cdn.distributionDomainName}` });
    new cdk.CfnOutput(this, "ApiUrl", { value: httpApi.apiEndpoint });
    new cdk.CfnOutput(this, "TableName", { value: table.tableName });
  }
}
