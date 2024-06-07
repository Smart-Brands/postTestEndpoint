import { Paginator } from "@smithy/types";
import {
  ListStatementsCommandInput,
  ListStatementsCommandOutput,
} from "../commands/ListStatementsCommand";
import { RedshiftDataPaginationConfiguration } from "./Interfaces";
export declare const paginateListStatements: (
  config: RedshiftDataPaginationConfiguration,
  input: ListStatementsCommandInput,
  ...rest: any[]
) => Paginator<ListStatementsCommandOutput>;
