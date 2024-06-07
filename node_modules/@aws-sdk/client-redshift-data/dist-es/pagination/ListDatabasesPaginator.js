import { createPaginator } from "@smithy/core";
import { ListDatabasesCommand, } from "../commands/ListDatabasesCommand";
import { RedshiftDataClient } from "../RedshiftDataClient";
export const paginateListDatabases = createPaginator(RedshiftDataClient, ListDatabasesCommand, "NextToken", "NextToken", "MaxResults");
