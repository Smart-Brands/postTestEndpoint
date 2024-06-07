import { Paginator } from "@smithy/types";
import {
  ListTablesCommandInput,
  ListTablesCommandOutput,
} from "../commands/ListTablesCommand";
import { RedshiftDataPaginationConfiguration } from "./Interfaces";
export declare const paginateListTables: (
  config: RedshiftDataPaginationConfiguration,
  input: ListTablesCommandInput,
  ...rest: any[]
) => Paginator<ListTablesCommandOutput>;
