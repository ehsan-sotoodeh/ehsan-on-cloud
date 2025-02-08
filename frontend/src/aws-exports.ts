import { AuthUserPoolConfig } from "@aws-amplify/auth";

export const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: "us-east-1_hup3qHo1E",
            userPoolClientId: "3shnhi7i2utdi3s0h3lk4kpq2o",
            region: "us-east-1",
        } as AuthUserPoolConfig,
    },
};

export default awsConfig;
