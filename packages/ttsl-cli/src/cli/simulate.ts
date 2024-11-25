import { createTTSLServices } from '@ttsl/lang';
import { NodeFileSystem } from 'langium/node';

export const simulate = async (date: string, data: string, targets: string, fsPaths: string[], ): Promise<void> => {
    const services = (await createTTSLServices(NodeFileSystem)).TTSL;
    
    const runner = services.runtime.Runner
    runner.runFunction("./helpers/simulate.ttsl", "simulate", [date, data, targets])
}