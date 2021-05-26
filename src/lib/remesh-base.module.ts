import { ModuleFlux, Pipe, Context, expectInstanceOf, expectAnyOf, Schema, Property } from '@youwol/flux-core';
import { Subject } from 'rxjs';
import { map, reduce, take } from 'rxjs/operators';
import { pmp } from './main';
import { createWorker, processInWorker } from './workers';
import * as _ from 'lodash'
import { Group, Mesh, BufferGeometry, BufferAttribute } from 'three';
import { IPmpMeshImplementation, PmpMesh} from './types.pmp';
import { getUrlBase } from '@youwol/cdn-client';
import {pack} from './main'
import { createFluxThreeObject3D, defaultMaterial } from '@youwol/flux-three';
import { AUTO_GENERATED } from '../auto_generated';

import * as FluxThree from '@youwol/flux-three'

interface ConfigBase{

    multiThreaded: boolean
    objectName: string
    objectId: string
}

function getWorkerPoolSizeAvailable(){
    if(navigator.hardwareConcurrency<3)
        return ["main-thread only", "1"]
    
    let options = [...new Array(navigator.hardwareConcurrency-2)].map( (_,i) => `${i+1}`)
    console.log("OPtions", options)
    return ["main-thread only", ...options]
}

@Schema({
    pack
})
export class RemeshConfiguration extends FluxThree.Schemas.Object3DConfiguration {

    
    @Property({
        description: "The maximum worker pool size",
        enum: getWorkerPoolSizeAvailable()
    })
    readonly workerPool: string

    constructor({ workerPool, ...others }: { workerPool?: string, others?: any } = {}) {
        super(others as any)
        this.workerPool = workerPool || getWorkerPoolSizeAvailable().slice(-1)[0]
    }
}

type TRemeshFunction<TConfig extends RemeshConfiguration> = (positions: ArrayLike<number>, indexes: ArrayLike<number>, 
    configuration: TConfig, pmpModule ) => IPmpMeshImplementation


let expectThreeMesh = expectInstanceOf<Mesh, BufferGeometry[]>({ 
    typeName:'Three.Mesh ', 
    Type: Mesh, attNames:['object', 'mesh'],
    normalizeTo: (mesh: Mesh, context: Context) => {
        return [mesh.geometry]
    }
})

let expectThreeGroup = expectInstanceOf<Group, BufferGeometry[]>({ 
    typeName:'Three.Group ', 
    Type: Group, attNames:['object', 'mesh'],
    normalizeTo: (group: Group, context: Context) => {

        return group.children
        .filter( child => child instanceof Mesh)
        .map( (mesh: Mesh) => mesh.geometry)
    }
})


let contract = expectAnyOf({
    description:'A Pmp Mesh',
    when:[
        expectThreeMesh,
        expectThreeGroup
    ]
})


export class RemeshBase<TConfig extends RemeshConfiguration> extends ModuleFlux {

    output$: Pipe<Object>

    remeshFunction : TRemeshFunction<TConfig>

    constructor(params, remeshFct: TRemeshFunction<TConfig>, description: string) {
        super(params)
        this.remeshFunction = remeshFct

        this.addInput({
            id:'input',
            description: 'Trigger re-meshing',
            contract,
            onTriggered: ({data, configuration, context}) => this.remesh(data, configuration, context)
        })

        this.output$ = this.addOutput({id:"output"})
    }


    remesh(inputSurfaces: Array<BufferGeometry>, configuration: TConfig, context: any) {

        //this.processSingleCPU(inputSurfaces, configuration, context)
        
        (configuration.workerPool == "main-thread only") 
            ? this.processSingleCPU(inputSurfaces, configuration, context)
            : this.processMultiThreaded(inputSurfaces, configuration, context)
    }

    processSingleCPU(geometries: Array<BufferGeometry>, configuration: TConfig, context){

        context.withChild('processSingleCPU', (ctx)=> {

            let meshes = geometries.map( (geometry: BufferGeometry, i: number) => {

                return ctx.withChild(`Start worker ${i}`, (workerCtx: Context)=> {
                    let positions = geometry.attributes.position.array
                    let indexes = geometry.index.array

                    let implSurface = this.remeshFunction(positions, indexes, configuration, pmp) 
                    let material = defaultMaterial()
                    material.wireframe = true
                    let mesh = new PmpMesh(implSurface, material)
                    workerCtx.info("Done re-meshing", {mesh})
                    return mesh 
                })
            })

            this.output$.next({ data: this.createOutputObject(meshes, configuration), context })
            context.terminate()
        
        })
    }
    

    processMultiThreaded(inputData: Array<BufferGeometry>, configuration: TConfig, context: Context) {

        let ctx = context.startChild('processMultiThreaded')
        let workerCount = parseInt(configuration.workerPool)
        let chunks = _.chunk(inputData, Math.max(1, inputData.length / workerCount))

        ctx.info(`Workers pool size: ${workerCount}`, {chunks})

        let remesheds$ = new Subject()
            remesheds$.pipe(
                map((surfaces: Array<{ positions, indexes }>) =>{

                    return surfaces.map(({ positions, indexes }) =>{ 
                        let surf = pmp.buildSurface(
                            new Float32Array(positions), 
                            new Uint16Array(indexes)
                            )
                        let material = defaultMaterial()
                        material.wireframe = true
                        return new PmpMesh(surf, material)
                        }
                    )
                }),
                take(chunks.length),
                reduce((acc, e) => acc.concat(e.flat()), []),
            ).subscribe((meshes) => {
                ctx.end()
                this.output$.next({ data: this.createOutputObject(meshes, configuration) , context}) 
                context.terminate()   
            })

        let url = getUrlBase('@youwol/flux-pmp', AUTO_GENERATED.version)
        fetch(`${url}/assets/pmp.js`).then(
            d => d.text()
        ).then(pmpSrcContent => {
            chunks.forEach((chunk, i) => {
                let workerCtx = ctx.startChild(`Start worker ${i}`)
                let [message, transferList] = this.formatMessage(i, pmpSrcContent, chunk, configuration)
                // creation of an inline web worker => see
                // more info https://medium.com/@dee_bloo/make-multithreading-easier-with-inline-web-workers-a58723428a42
                let worker = createWorker(processInWorker)
                worker.postMessage(message, transferList as ArrayBuffer[])
                worker.onmessage = function ({ data: { remesheds, log } }) {
                
                    if(remesheds){
                        remesheds$.next(remesheds)
                        workerCtx.end()
                    }
                    if(log)
                        workerCtx.info(log.content, log.data || {})
                }
            })
        })
    }

    formatMessage(
        workerId: number, 
        pmpSrcContent: string, 
        chunk: Array<BufferGeometry>,
        configuration: TConfig){

        function toWorkerArray(att: BufferAttribute, TypedArray) {
            if(att.array['buffer'] instanceof SharedArrayBuffer )
                return att.array['buffer']
            let buffer = new ArrayBuffer(att.count * TypedArray.BYTES_PER_ELEMENT)
            new TypedArray(buffer).set(att.array, 0)
            return buffer
        }

        let itemsToTransfert = [
            ...chunk.map( (geometry: BufferGeometry) => {
                return toWorkerArray(geometry.attributes.position as BufferAttribute, Float32Array) 
            }),
            ...chunk.map( (geometry: BufferGeometry) => {
                return toWorkerArray(geometry.index as BufferAttribute, Int16Array)
            })
        ]

        return [
            {
                workerId,
                // these references ArrayBuffer provided in itemsToTransfert
                // more info https://developer.mozilla.org/fr/docs/Web/API/Worker/postMessage
                inputData: chunk.map((data, i) => {
                    return { 
                        positions: itemsToTransfert[i], 
                        indexes: itemsToTransfert[i + chunk.length] }
                }),
                pmpSrcContent,
                // we copy the function that does remeshing for individual surface
                remeshSurfaceFct: "return " + this.remeshFunction.toString(),
                config: configuration
            }, 
            itemsToTransfert.filter( array => ! (array instanceof SharedArrayBuffer) )
        ]
    }

    createOutputObject(meshes: PmpMesh[], configuration: TConfig){
        let group = new Group() 
        meshes.forEach( (skin) => {
            group.add(skin)
        })
        let obj = createFluxThreeObject3D({
            object:group,
            id:configuration.objectId,
            displayName:configuration.objectId
        })
        return obj
    }
}