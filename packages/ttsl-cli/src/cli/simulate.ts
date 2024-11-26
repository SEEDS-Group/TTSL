import { createTTSLServices } from '@ttsl/lang';
import { URI } from 'langium';
import { NodeFileSystem } from 'langium/node';

export const simulate = async (date: string, data: string, targets: string, fsPaths: string ): Promise<void> => {
    const services = (await createTTSLServices(NodeFileSystem)).TTSL;

    let uri = URI.file(fsPaths)
    const runner = services.runtime.Runner
    runner.runSimulation(uri.toString(), "simulate", [date, data, targets])
}