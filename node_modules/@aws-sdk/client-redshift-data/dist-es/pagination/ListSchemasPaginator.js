import { createPaginator } from "@smithy/core";
import { ListSchemasCommand } from "../commands/ListSchemasCommand";
import { RedshiftDataClient } from "../RedshiftDataClient";
export const paginateListSchemas = createPaginator(RedshiftDataClient, ListSchemasCommand, "NextToken", "NextToken", "MaxResults");
