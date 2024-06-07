import { Paginator } from "@smithy/types";
import { GetStatementResultCommandInput, GetStatementResultCommandOutput } from "../commands/GetStatementResultCommand";
import { RedshiftDataPaginationConfiguration } from "./Interfaces";
/**
 * @public
 */
export declare const paginateGetStatementResult: (config: RedshiftDataPaginationConfiguration, input: GetStatementResultCommandInput, ...rest: any[]) => Paginator<GetStatementResultCommandOutput>;
