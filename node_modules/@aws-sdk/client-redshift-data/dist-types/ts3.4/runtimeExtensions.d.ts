import { RedshiftDataExtensionConfiguration } from "./extensionConfiguration";
export interface RuntimeExtension {
  configure(extensionConfiguration: RedshiftDataExtensionConfiguration): void;
}
export interface RuntimeExtensionsConfig {
  extensions: RuntimeExtension[];
}
export declare const resolveRuntimeExtensions: (
  runtimeConfig: any,
  extensions: RuntimeExtension[]
) => any;
