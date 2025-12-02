# AWS Setup Guide for FinanzApp

This guide will walk you through setting up AWS services (Textract and Bedrock) for FinanzApp.

## Prerequisites

- AWS Account
- AWS CLI installed (optional but recommended)

## Step 1: Create IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. Enter username: `finanzapp-backend`
4. Click **Next**

## Step 2: Attach Permissions

### Option A: Create Custom Policy (Recommended)

1. Click **Attach policies directly**
2. Click **Create policy**
3. Switch to **JSON** tab
4. Paste the following policy:

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "TextractAccess",
			"Effect": "Allow",
			"Action": ["textract:DetectDocumentText", "textract:AnalyzeDocument"],
			"Resource": "*"
		},
		{
			"Sid": "BedrockAccess",
			"Effect": "Allow",
			"Action": ["bedrock:InvokeModel"],
			"Resource": [
				"arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
				"arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"
			]
		}
	]
}
```

5. Click **Next**
6. Name the policy: `FinanzAppBackendPolicy`
7. Click **Create policy**
8. Go back to user creation and attach the newly created policy

### Option B: Use AWS Managed Policies (Less Secure)

Attach these managed policies:

- `AmazonTextractFullAccess`
- `AmazonBedrockFullAccess`

Note: Managed policies grant broader permissions than needed.

## Step 3: Create Access Keys

1. After creating the user, click on the username
2. Go to **Security credentials** tab
3. Scroll down to **Access keys**
4. Click **Create access key**
5. Select **Application running outside AWS**
6. Click **Next** → **Create access key**
7. **IMPORTANT**: Copy both:

   - Access key ID
   - Secret access key

   You won't be able to see the secret key again!

## Step 4: Enable Bedrock Models

1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Select your region (e.g., `us-east-1`)
3. Click **Model access** in the left sidebar
4. Click **Manage model access**
5. Check the boxes for:
   - **Anthropic** → **Claude 3 Haiku**
   - **Anthropic** → **Claude 3.5 Sonnet** (optional, more expensive)
6. Click **Request model access**
7. Wait for approval (usually instant for Claude models)

## Step 5: Configure Backend

1. Open your `.env` file in `backend/aws-api/`
2. Add your credentials:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Choose your model
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

### Available Claude Models

| Model             | ID                                          | Speed  | Cost | Use Case                 |
| ----------------- | ------------------------------------------- | ------ | ---- | ------------------------ |
| Claude 3 Haiku    | `anthropic.claude-3-haiku-20240307-v1:0`    | Fast   | Low  | Production (recommended) |
| Claude 3.5 Sonnet | `anthropic.claude-3-5-sonnet-20240620-v1:0` | Medium | High | High accuracy needs      |

## Step 6: Test Configuration

Run the health check:

```bash
cd backend/aws-api
npm run dev
```

In another terminal:

```bash
curl http://localhost:8080/health
```

Expected response:

```json
{
	"status": "healthy",
	"timestamp": "2025-11-22T10:00:00.000Z",
	"service": "finanzapp-aws-api"
}
```

## Step 7: Test with Sample Receipt

```bash
curl -X POST http://localhost:8080/api/receipt/process \
  -F "image=@path/to/receipt.jpg" \
  -F "userId=test-user"
```

If successful, you should get a JSON response with extracted receipt data.

## Troubleshooting

### Error: "The security token included in the request is invalid"

- Check that your access key and secret key are correct
- Ensure the IAM user has the required permissions
- Verify the keys are not expired

### Error: "Could not connect to the endpoint URL"

- Check your `AWS_REGION` is correct
- Ensure Bedrock is available in your region
- Try using `us-east-1` which has the most services

### Error: "AccessDeniedException"

- Verify IAM policies are attached to the user
- Check Bedrock model access is approved
- Ensure the model ID in `.env` matches an approved model

### Error: "ValidationException: The provided model identifier is invalid"

- Check `BEDROCK_MODEL_ID` in `.env` is correct
- Ensure you've requested access to that specific model
- Verify the model is available in your region

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Rotate access keys regularly** - Every 90 days recommended
3. **Use least privilege** - Only grant necessary permissions
4. **Enable MFA** - For your AWS root account
5. **Monitor usage** - Set up billing alerts in AWS

## Cost Monitoring

1. Go to [AWS Billing Dashboard](https://console.aws.amazon.com/billing/)
2. Click **Budgets** → **Create budget**
3. Set a monthly budget (e.g., $10)
4. Add email alerts at 80% and 100%

## Next Steps

- AWS configured
- Set up Supabase (see main README)
- Test the complete flow
- Deploy to production

## Support

For AWS-specific issues:

- [AWS Textract Documentation](https://docs.aws.amazon.com/textract/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS Support Center](https://console.aws.amazon.com/support/)
