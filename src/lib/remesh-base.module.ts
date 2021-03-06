import { ModuleFlux, Pipe, Context, expectInstanceOf, expectAnyOf } from '@youwol/flux-core';
import { forkJoin } from 'rxjs';
import { filter, map} from 'rxjs/operators';
import { pmp } from './main';
import * as _ from 'lodash'
import { Group, Mesh, BufferGeometry } from 'three';
import { createFluxThreeObject3D, defaultMaterial } from '@youwol/flux-three';

import * as FluxThree from '@youwol/flux-three'
import { WorkerContext } from '@youwol/flux-core/src/lib/worker-pool';
import { PmpMesh } from './types.pmp';


//Icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a>
export let svgRemeshIcon = `
<path xmlns="http://www.w3.org/2000/svg" d="M502.119,377.125c-13.239,4.385-26.744,8.435-40.219,12.11c-3.507-9.345-11.323-16.593-21.017-19.323    c-2.774-36.168-10.07-60.945-16.45-78.778c8.672-5.182,14.656-14.398,15.351-25.037c22.545-5.337,45.085-11.71,67.063-18.988    c3.94-1.306,6.076-5.557,4.771-9.496c-1.305-3.941-5.557-6.075-9.496-4.772c-21.293,7.052-43.123,13.236-64.962,18.432    c-4.909-11.068-15.995-18.813-28.862-18.813c-2.349,0-4.634,0.266-6.838,0.754c-6.71-18.498-13.386-41.911-16.034-75.265    c12.649-3.858,21.943-15.461,22.346-29.258c33.444-6.48,66.758-15.161,99.075-25.863c3.888-1.287,6.059-5.61,4.771-9.497    c-1.288-3.887-5.609-6.056-9.496-4.771c-31.799,10.531-64.582,19.068-97.491,25.431c-3.866-7.942-10.969-14.025-19.581-16.534    c2.61-40.118,10.99-66.578,18.923-87.242c1.487-3.874-0.448-8.221-4.322-9.708c-3.876-1.484-8.222,0.448-9.709,4.322    c-8.363,21.785-17.201,49.686-19.912,91.981c-12.963,2.595-23.081,13.156-25.017,26.342c-27.306,3.125-54.987,4.827-82.418,5.06    c-2.911-11.795-12.467-20.999-24.456-23.391c2.003-43.955,10.44-71.458,19.328-94.607c1.487-3.874-0.448-8.221-4.322-9.708    c-3.875-1.484-8.222,0.448-9.709,4.322c-8.984,23.404-18.364,53.608-20.373,100.665c-10.09,2.969-18.097,10.846-21.234,20.864    c-27.676-1.925-55.475-5.348-82.802-10.204c-1.598-14.051-12.454-25.33-26.305-27.566c3.182-35.347,10.957-59.406,18.238-78.372    c1.487-3.874-0.448-8.221-4.322-9.708c-3.875-1.485-8.222,0.447-9.709,4.322c-7.836,20.414-16.22,46.431-19.405,85.034    c-7.099,2.419-13.069,7.293-16.886,13.614C43.593,99.086,26.545,94.08,9.881,88.56c-3.94-1.303-8.191,0.833-9.496,4.771    c-1.305,3.941,0.832,8.192,4.771,9.497c16.752,5.548,33.885,10.589,51.019,15.021c-0.037,0.626-0.062,1.256-0.062,1.892    c0,13.577,8.619,25.179,20.672,29.624c2.158,40.025,9.679,67.23,17.347,88.464c-5.418,3.65-9.644,8.935-11.971,15.141    c-24.344-5.545-48.633-12.297-72.281-20.129c-3.943-1.305-8.192,0.832-9.496,4.772c-1.305,3.94,0.832,8.191,4.771,9.497    c24.618,8.152,49.917,15.158,75.261,20.876c1.957,15.538,15.244,27.599,31.304,27.599c1.763,0,3.491-0.152,5.176-0.432    c7.729,21.387,15.296,49.063,16.849,91.251c-8.552,2.878-15.479,9.316-19,17.554c-35.467-6.511-70.723-15.525-104.866-26.834    c-3.94-1.304-8.191,0.832-9.497,4.771c-1.305,3.941,0.832,8.192,4.771,9.497c34.894,11.556,70.926,20.763,107.172,27.401    c0.946,12.131,8.773,22.353,19.576,26.76c-2.182,20.197-6.034,38.282-12.039,56.597c-1.227,3.74,0.738,7.903,4.403,9.339    c3.967,1.554,8.553-0.613,9.878-4.656c6.285-19.165,10.331-38.064,12.638-59.098c12.148-1.151,22.306-9.215,26.497-20.205    c27.394,2.857,55.2,4.32,82.721,4.32c0.464,0,0.944-0.004,1.411-0.005c2.523,10.293,10.103,18.619,19.949,22.18    c-2.294,16.908-5.798,32.293-10.989,48.125c-1.227,3.74,0.738,7.903,4.403,9.339c3.968,1.554,8.553-0.613,9.878-4.656    c5.529-16.861,9.243-33.226,11.661-51.23c13.764-1.862,24.738-12.623,26.914-26.285c29.02-2.312,58.156-6.248,86.747-11.716    c4.563,6.927,11.774,11.958,20.184,13.636c-1.726,25.98-5.975,48.633-13.28,70.912c-1.227,3.74,0.738,7.903,4.403,9.339    c3.968,1.554,8.553-0.613,9.878-4.656c7.865-23.985,12.36-48.314,14.096-76.272c11.82-3.486,20.769-13.717,22.381-26.219    c14.47-3.902,28.991-8.241,43.21-12.949c3.94-1.306,6.076-5.557,4.771-9.497C510.311,377.956,506.059,375.822,502.119,377.125z     M408.298,247.49c9.116,0,16.532,7.416,16.532,16.532c0,9.116-7.416,16.532-16.532,16.532s-16.532-7.416-16.532-16.532    S399.183,247.49,408.298,247.49z M376.236,111.224c9.116,0,16.532,7.416,16.532,16.532c0,9.116-7.416,16.532-16.532,16.532    s-16.532-7.416-16.532-16.532C359.704,118.641,367.12,111.224,376.236,111.224z M231.955,119.24    c9.116,0,16.532,7.416,16.532,16.532s-7.416,16.532-16.532,16.532c-9.116,0-16.532-7.416-16.532-16.532    S222.84,119.24,231.955,119.24z M71.143,119.741c0-9.116,7.416-16.532,16.532-16.532s16.532,7.416,16.532,16.532    s-7.416,16.532-16.532,16.532S71.143,128.857,71.143,119.741z M91.932,151.007c11.541-1.564,21.116-9.386,25.19-19.93    c27.655,4.886,55.778,8.337,83.777,10.279c2.212,12.334,11.609,22.199,23.691,25.1c3.8,38.007,12.824,64.147,22.136,87.213    c-6.473,4.256-11.297,10.822-13.278,18.521c-30.086-0.87-60.376-3.501-90.173-7.837c0.001-0.111,0.008-0.22,0.008-0.332    c0-17.403-14.159-31.561-31.561-31.561c-1.175,0-2.335,0.07-3.477,0.195C101.128,212.919,94.154,187.742,91.932,151.007z     M111.722,280.554c-9.116,0-16.532-7.416-16.532-16.532s7.416-16.532,16.532-16.532s16.532,7.416,16.532,16.532    C128.254,273.137,120.837,280.554,111.722,280.554z M143.784,432.85c-9.116,0-16.532-7.416-16.532-16.532    s7.416-16.532,16.532-16.532c9.116,0,16.532,7.416,16.532,16.532S152.9,432.85,143.784,432.85z M257.415,416.814    c-0.468,0-0.949,0.005-1.414,0.005c-26.907,0-54.094-1.427-80.881-4.21c-1.65-14.025-12.526-25.265-26.38-27.459    c-1.704-44.378-9.814-73.451-18.012-95.95c3.603-2.726,6.606-6.205,8.77-10.203c30.977,4.574,62.495,7.331,93.79,8.225    c3.256,13.959,15.794,24.392,30.73,24.392c1.594,0,3.16-0.121,4.691-0.351c7.464,25.159,11.135,51.028,11.741,82.442    C269.123,396.523,260.198,405.473,257.415,416.814z M247.486,280.053c0-9.116,7.416-16.532,16.532-16.532    c9.116,0,16.532,7.416,16.532,16.532c0,9.116-7.416,16.532-16.532,16.532C254.902,296.585,247.486,289.169,247.486,280.053z     M288.065,440.866c-9.116,0-16.532-7.416-16.532-16.532s7.416-16.532,16.532-16.532s16.532,7.416,16.532,16.532    S297.18,440.866,288.065,440.866z M400.784,400.287c0,1.003,0.052,1.994,0.144,2.973c-27.352,5.149-55.197,8.871-82.933,11.08    c-3.422-10.219-11.934-18.12-22.516-20.678c-0.636-33.137-4.734-61.405-12.811-88.167c6.138-4.512,10.59-11.185,12.223-18.89    c11.2-0.548,22.5-1.327,33.661-2.347c4.133-0.378,7.177-4.034,6.799-8.167c-0.377-4.133-4.04-7.181-8.167-6.799    c-10.865,0.993-21.864,1.752-32.769,2.288c-3.712-13.299-15.929-23.088-30.397-23.088c-1.05,0-2.088,0.054-3.112,0.154    c-9.175-22.643-17.504-46.601-21.213-82.275c11.286-2.855,20.164-11.805,22.924-23.128c27.895-0.232,56.044-1.958,83.815-5.124    c3.678,10.547,12.8,18.558,23.987,20.652c2.84,36.268,10.217,61.393,17.503,81.178c-6.624,5.616-10.904,13.908-11.161,23.192    c-5.863,0.915-11.753,1.787-17.596,2.564c-4.114,0.547-7.007,4.324-6.46,8.439c0.502,3.778,3.729,6.526,7.439,6.526    c0.33,0,0.663-0.021,0.999-0.066c6.241-0.829,12.536-1.763,18.795-2.746c5.136,10.486,15.918,17.726,28.36,17.726    c0.587,0,1.17-0.019,1.75-0.051c6.014,16.706,12.953,39.922,15.723,73.885C411.514,372.453,400.784,385.138,400.784,400.287z     M432.345,416.819c-9.116,0-16.532-7.416-16.532-16.532c0-9.116,7.416-16.532,16.532-16.532s16.532,7.416,16.532,16.532    C448.877,409.402,441.461,416.819,432.345,416.819z"/>
`

export class WorkerArguments<TConfig>{
    positions: Float32Array 
    indexes: Uint16Array
    config: TConfig
}

type TRemeshFunction<TConfig> =
( { args, taskId, context, workerScope }:{
    args: WorkerArguments<TConfig>, 
    taskId: string,
    workerScope: any,
    context: WorkerContext
}) => void


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


export class RemeshBase<TConfig extends FluxThree.Schemas.Object3DConfiguration> extends ModuleFlux {

    output$: Pipe<Object>
    name: string
    remeshFunctionInWorker : TRemeshFunction<TConfig>

    constructor(params, name: string, remeshFct: TRemeshFunction<TConfig>) {
        super(params)
        this.remeshFunctionInWorker = remeshFct
        this.name = name
        this.addInput({
            id:'input',
            description: 'Trigger re-meshing',
            contract,
            onTriggered: ({data, configuration, context}) => this.processMultiThreaded(data, configuration, context)
        })

        this.output$ = this.addOutput({id:"output"})
    }

    processMultiThreaded(geometries: Array<BufferGeometry>, configuration: TConfig, context: Context) {

        let remesheds$ = geometries.map( (geometry: BufferGeometry, i) => {

            return context.withChild(`Start re-meshing geometry ${i}`, (ctx: Context)=> {

                let channel$ = this.environment.workerPool.schedule<WorkerArguments<TConfig>>({
                    title: this.name,
                    entryPoint: this.remeshFunctionInWorker,
                    args:{ 
                        positions: geometry.attributes.position.array as Float32Array,
                        indexes: geometry.index.array as Uint16Array,
                        config: configuration
                    },
                    context:ctx
                })
                return channel$.pipe( 
                    filter( ({type}) => type == "Exit"),
                    map(({data}) => {
                        ctx.info("Remesh done", data.result)
                        let { positions, indexes } = data.result
                        let surf = pmp.buildSurface( new Float32Array(positions),  new Uint16Array(indexes) )
                        let material = defaultMaterial()
                        material.wireframe = true
                        return new PmpMesh(surf, material)
                    })
                )
            })
        })
        forkJoin(remesheds$).subscribe( (meshes) => {
            this.output$.next({ data: this.createOutputObject(meshes, configuration), context })
            context.terminate()
        })
    }
    
    createOutputObject(meshes: PmpMesh[], configuration: TConfig){
        let group = new Group() 
        meshes.forEach( (object, i) => {
            createFluxThreeObject3D({
                object,
                id:`${configuration.objectId}_${i}`,
                displayName:configuration.objectId
            })
            group.add(object)
        })
        let obj = createFluxThreeObject3D({
            object:group,
            id:configuration.objectId,
            displayName:configuration.objectId,
            transform: configuration.transform
        })
        return obj
    }
}