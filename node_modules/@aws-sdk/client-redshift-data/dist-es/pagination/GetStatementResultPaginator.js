import { createPaginator } from "@smithy/core";
import { GetStatementResultCommand, } from "../commands/GetStatementResultCommand";
import { RedshiftDataClient } from "../RedshiftDataClient";
export const paginateGetStatementResult = createPaginator(RedshiftDataClient, GetStatementResultCommand, "NextToken", "NextToken", "");
