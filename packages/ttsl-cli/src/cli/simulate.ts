import { createTTSLServices } from '@ttsl/lang';
import { URI } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { generate } from './generate.js';
import { spawn } from 'child_process';

export const simulate = async (date: string, data: string, targets: string, fsPaths: string ): Promise<void> => {
    let args = [date, data, targets]

    await generate([fsPaths], {out: fsPaths+"/../generate", sourcemaps: false}, args)
    const pythonProcess = spawn("python", ["C:\\Users\\tatam\\Documents\\Uni\\Bachelor\\TTSL\\packages\\ttsl-cli\\tests\\resources\\commands\\generate\\tests\\commands\\simulation\\gen_main_simulate.py"].concat(date, data, targets))
 
    let datas = '';
    pythonProcess.stdout.on('data', (chunk) => {
        datas += chunk.toString(); // Collect data from Python script
    });
 
    pythonProcess.stderr.on('data', (error) => {
        console.error(`stderr: ${error}`);
    });
 
    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.log(`Python script exited with code ${code}`);
        } else {
            console.log('Python script executed successfully');
        }
    });
}
