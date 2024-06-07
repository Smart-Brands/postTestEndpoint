import { Paginator } from "@smithy/types";
import {
  ListDatabasesCommandInput,
  ListDatabasesCommandOutput,
} from "../commands/ListDatabasesCommand";
import { RedshiftDataPaginationConfiguration } from "./Interfaces";
export declare const paginateListDatabases: (
  config: RedshiftDataPaginationConfiguration,
  input: ListDatabasesCommandInput,
  ...rest: any[]
) => Paginator<ListDatabasesCommandOutput>;
