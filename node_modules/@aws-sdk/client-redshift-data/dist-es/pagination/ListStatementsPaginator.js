import { createPaginator } from "@smithy/core";
import { ListStatementsCommand, } from "../commands/ListStatementsCommand";
import { RedshiftDataClient } from "../RedshiftDataClient";
export const paginateListStatements = createPaginator(RedshiftDataClient, ListStatementsCommand, "NextToken", "NextToken", "MaxResults");
