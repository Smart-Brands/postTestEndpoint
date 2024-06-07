import { createPaginator } from "@smithy/core";
import { ListTablesCommand } from "../commands/ListTablesCommand";
import { RedshiftDataClient } from "../RedshiftDataClient";
export const paginateListTables = createPaginator(RedshiftDataClient, ListTablesCommand, "NextToken", "NextToken", "MaxResults");
