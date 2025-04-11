# lambda

- deployment of a lambda function

```sh
terraform init --backend-config="bucket=xxxx" --backend-config="key=xxxx/terraform.tfstate" --reconfigure
terraform plan -var-file=tfvars/variables.tfvars
terraform apply -var-file=tfvars/variables.tfvars
```
