import { createPaginator } from "@smithy/core";
import { DescribeTableCommand, } from "../commands/DescribeTableCommand";
import { RedshiftDataClient } from "../RedshiftDataClient";
export const paginateDescribeTable = createPaginator(RedshiftDataClient, DescribeTableCommand, "NextToken", "NextToken", "MaxResults");
