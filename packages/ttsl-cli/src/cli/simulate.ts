import { generate } from './generate.js';
import { execSync, spawn } from 'child_process';

export const simulate = async (date: string, data: string, targets: string, fsPaths: string ): Promise<void> => {
    let args = [date, data, targets]

    await generate([fsPaths], {out: fsPaths+"/../generate", sourcemaps: false}, args)
    const pythonProcess = spawn("python", ["C:\\Users\\tatam\\Documents\\Uni\\Bachelor\\TTSL\\packages\\ttsl-cli\\tests\\resources\\simulate\\generate\\tests\\simulate\\main\\gen_main_simulate.py"])

    pythonProcess.stdout.on('data', (d) => {
        console.log(`${d}`); //print simulation results
    });
 
    pythonProcess.stderr.on('data', (error) => {
        console.log(`stderr: ${error}`);
    });
 
    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.log(`Python script exited with code ${code}`);
        } else {
            console.log('Python script executed successfully');
        }
    });
}
