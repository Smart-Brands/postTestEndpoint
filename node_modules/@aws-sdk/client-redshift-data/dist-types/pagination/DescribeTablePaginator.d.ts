import { Paginator } from "@smithy/types";
import { DescribeTableCommandInput, DescribeTableCommandOutput } from "../commands/DescribeTableCommand";
import { RedshiftDataPaginationConfiguration } from "./Interfaces";
/**
 * @public
 */
export declare const paginateDescribeTable: (config: RedshiftDataPaginationConfiguration, input: DescribeTableCommandInput, ...rest: any[]) => Paginator<DescribeTableCommandOutput>;
