import { PaginationConfiguration } from "@smithy/types";
import { RedshiftDataClient } from "../RedshiftDataClient";
export interface RedshiftDataPaginationConfiguration
  extends PaginationConfiguration {
  client: RedshiftDataClient;
}
