import { IPmpMeshImplementation } from "./types.pmp";


export function createWorker(fn) {
    var blob = new Blob(['self.onmessage = ', fn.toString()], { type: 'text/javascript' });
    var url = URL.createObjectURL(blob);
    return new Worker(url);
}


export function processInWorker({ 
    data: { 
        pmpSrcContent, 
        inputData, 
        config, 
        workerId, 
        remeshSurfaceFct } }:
    { data: { 
        pmpSrcContent: string, 
        config: Object, 
        workerId: string, 
        inputData: Array<{positions:ArrayBuffer, indexes:ArrayBuffer}>, 
        remeshSurfaceFct: string 
    } }) {
    
    var PmpModule
    let GlobalScope = self as any
    
    GlobalScope.postMessage({ 
        workerId, 
        type: 'log',
        log:{
            content: `Worker ${workerId} started`
        }
    })

    let t0 = performance.now()
    eval(pmpSrcContent)
    let t1 = performance.now()
    GlobalScope.postMessage({ 
        workerId, 
        type: 'log',
        log:{
            content: `Pmp source parsed, elapsed time: ${Math.floor(100*(t1 - t0))/100} ms`
        }
    })
    let processOneSurface = new Function(remeshSurfaceFct)()

    PmpModule.onRuntimeInitialized = () => {

        let t2 = performance.now()
        GlobalScope.postMessage({ 
            workerId, 
            type: 'log',
            log:{
                content: `WASM runtime initialized, elapsed time: ${Math.floor(100*(t2 - t1))/100} ms`
            }
        })
        let t3 = undefined
        let remesheds = inputData
            .map(data => {
                let positions = new Float32Array(data.positions)
                let index = new Int16Array(data.indexes)
                let surface = processOneSurface(positions, index, config, PmpModule, workerId)
                t3 = performance.now()
                GlobalScope.postMessage({ 
                    workerId, 
                    type: 'log',
                    log:{
                        content: `Remeshing done, elapsed time: ${Math.floor(100*(t3 - t2))/100} ms`
                    }
                })
                t2 = t3
                return surface
            })
            .map( (surface: IPmpMeshImplementation) => {
                let positions = surface.position()
                let indexes = surface.index()
                let positionsSharedBuffer = new SharedArrayBuffer(positions.length * Float32Array.BYTES_PER_ELEMENT)
                let indexesSharedBuffer = new SharedArrayBuffer(indexes.length * Uint16Array.BYTES_PER_ELEMENT)
                new Float32Array(positionsSharedBuffer).set(positions,0)
                new Uint16Array(indexesSharedBuffer).set(indexes,0)
                let t4 = performance.now()
                GlobalScope.postMessage({ 
                    workerId, 
                    type: 'log',
                    log:{
                        content: `Array buffers copied from WASM memory, elapsed time: ${Math.floor(100*(t4 - t3))/100} ms`
                    }
                })
                t3 = t4
                return {
                    positions: positionsSharedBuffer,
                    indexes: indexesSharedBuffer
                }
            })

        GlobalScope.postMessage({ workerId, type:'result', remesheds })
    }
}
