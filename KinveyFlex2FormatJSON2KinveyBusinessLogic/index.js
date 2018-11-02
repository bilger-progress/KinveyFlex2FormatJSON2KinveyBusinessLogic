"use-strict"

// External dependencies.
const kinveyFlexSDK = require("kinvey-flex-sdk");

// Initialize Kinvey Flex Service.
kinveyFlexSDK.service(function (error, flex) {
    // Check if all is fine with initialization.
    if (error) {
        console.log("Error while initializing Flex!");
        return;
    }

    // Register the function, which will prepare the JSON data, and will pass to BL script.
    flex.functions.register("prepareDataAndPassToBL", function (context, complete, modules) {
        // Add Kinvey specific attributes (access control lists, meta data).
        context.body.body.forEach(function (item) {
            item = modules.kinveyEntity.entity(item);
            // Make sure to have the creator as the user making this request.
            item._acl.creator = modules.requestContext.getAuthenticatedUserId();
        });

        // Options for the Business Logic script to be executed.
        let blExecutionOptions = {
            useUserContext: true
        };
        let insertJSONdata = modules.endpointRunner(blExecutionOptions).endpoint("insertJSONdata");
        let blRequestBody = context.body;

        // Call the BL script.
        insertJSONdata.execute(blRequestBody, function (error, result) {
            // Is all fine with BL script execution?
            if (error) {
                flex.logger.error(error);
                return complete().setBody({
                    success: false,
                    message: "Executing Business Logic failed.",
                    additional: "Please see Kinvey Flex logs."
                }).runtimeError().done();
            }

            // All is good.
            flex.logger.info(result);
            return complete().setBody({
                success: true,
                message: "Executing Business Logic succeeded.",
                additional: "Please see Kinvey Flex logs."
            }).ok().next();
        });
    });
});