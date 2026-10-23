import * as cdk from "aws-cdk-lib";
import { SteadyUpStack } from "./stack";
const app = new cdk.App();
// `-c stage=wc` deploys a separate copy (SteadyUp-wc) so experiments never touch the submitted stack.
const stage = app.node.tryGetContext("stage") as string | undefined;
new SteadyUpStack(app, stage ? `SteadyUp-${stage}` : "SteadyUp", { env: { region: "us-east-1" } });
