import { Paginator } from "@smithy/types";
import {
  ListSchemasCommandInput,
  ListSchemasCommandOutput,
} from "../commands/ListSchemasCommand";
import { RedshiftDataPaginationConfiguration } from "./Interfaces";
export declare const paginateListSchemas: (
  config: RedshiftDataPaginationConfiguration,
  input: ListSchemasCommandInput,
  ...rest: any[]
) => Paginator<ListSchemasCommandOutput>;
