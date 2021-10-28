env=stage

node_modules:
	npm install

set_stack:: node_modules
	pulumi stack select "shapeshift-legacy/$(env)"

preview:: set_stack
	pulumi preview

update:: set_stack
	pulumi update

ecr_login::
	aws ecr --region=eu-west-1 get-login --no-include-email | sh

ci_update:: set_stack ecr_login
	pulumi update --yes --skip-preview