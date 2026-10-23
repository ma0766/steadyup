import * as cdk from "aws-cdk-lib";
import { SteadyUpStack } from "./stack";
const app = new cdk.App();
new SteadyUpStack(app, "SteadyUp", { env: { region: "us-east-1" } });
