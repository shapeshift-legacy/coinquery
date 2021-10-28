NETWORK_NAME = coinquery-network

.PHONY: init-network
init-network:
	@aws --region $(REGION) --profile blockrange \
		 cloudformation create-stack \
	  	 --stack-name $(NETWORK_NAME) \
		 --template-body file://network.json \
		 --capabilities CAPABILITY_IAM

.PHONY: update-network
update-network:
	@aws --region $(REGION) --profile blockrange \
		cloudformation update-stack \
		--stack-name $(NETWORK_NAME) \
		--template-body file://network.json \
		--capabilities CAPABILITY_IAM

##############################################
############### BASTION SERVER ###############
##############################################

BASTION_STACK_NAME = cq-bastion
USER_DATA_BUCKET=all-userdata-scripts
USER_DATA_SCRIPT=yubikey-setup.sh

 .PHONY: bastion-init
bastion-init:
	aws --region $(REGION) cloudformation create-stack \
		--stack-name $(BASTION_STACK_NAME) \
		--template-body file://bastion.yaml \
		--capabilities CAPABILITY_IAM \
		--parameters \
			ParameterKey=ScriptBucket,ParameterValue="$(USER_DATA_BUCKET)" \
			ParameterKey=ScriptKey,ParameterValue="$(USER_DATA_SCRIPT)"
			
 .PHONY: bastion-update
bastion-update:
	aws --region $(REGION) cloudformation update-stack \
		--stack-name $(BASTION_STACK_NAME) \
		--template-body file://bastion.yaml \
		--capabilities CAPABILITY_IAM \
		--parameters \
			ParameterKey=ScriptBucket,ParameterValue="$(USER_DATA_BUCKET)" \
			ParameterKey=ScriptKey,ParameterValue="$(USER_DATA_SCRIPT)"
