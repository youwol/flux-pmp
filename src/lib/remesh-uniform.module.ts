
import { pack } from './main';
import { Property, Flux, BuilderView, Schema} from '@youwol/flux-core'
import *  as _ from 'lodash'
import { RemeshBase, svgRemeshIcon, WorkerArguments } from './remesh-base.module';
import { WorkerContext } from '@youwol/flux-core/src/lib/worker-pool';

import * as FluxThree from '@youwol/flux-three'
/**
 * ## Description 
 * 
 * Perform uniform surface remeshing.
 * 
 * ## Example

The following example illustrates a simple use of the module:
<iframe 
    title="Simple example"
    width="100%"
    height="500px"
    src="/ui/flux-runner/?id=e4a7e20f-70d3-4d89-baf2-ef3d5e04dc07"> 
</iframe>

The underlying workflow can be accessed [here](/ui/flux-builder/?id=e4a7e20f-70d3-4d89-baf2-ef3d5e04dc07).

 * ## Technical details
 * 
 * More information can be found:
 * -    [pmp class documentation](https://www.pmp-library.org/classpmp_1_1_surface_remeshing.html)
 * -    Original article: Mario Botsch and Leif Kobbelt. A remeshing approach to multiresolution modeling. 
 * In Proceedings of Eurographics Symposium on Geometry Processing, pages 189–96, 2004.
 */
export namespace ModuleRemeshUniform {

    /**
     * ## Description
     * 
     * Parameters for the surface re-meshing parameters.
     * 
     * Detailed description can be found here:
     * -    Original article: Mario Botsch and Leif Kobbelt. A remeshing approach to multiresolution modeling. 
     * In Proceedings of Eurographics Symposium on Geometry Processing, pages 189–96, 2004.
     */
    @Schema({
        pack: pack,
        description: "Persistent Data of RemeshUniform"
    })
    export class PersistentData  extends FluxThree.Schemas.Object3DConfiguration{

        /**
         * Factor that defines meshing resolution w/ original resolution
         */
        @Property({ description: "Factor that defines meshing resolution w/ original resolution" })
        readonly edgeFactor: number = 1

        /**
         * Number of iteration
         */
        @Property({ description: "Number of iteration" })
        readonly iterationsCount: number = 10

        /**
         * Use projection
         */
        @Property({ description: "Use projection" })
        readonly useProjection: boolean = true

        constructor({ edgeFactor, iterationsCount, useProjection, ...others}:
            {
                edgeFactor?: number, iterationsCount?: number, useProjection?: boolean,
                multiThreaded?: boolean, others?:any 
            } = {}) {
            super( {
                ...others,
                ...{ 
                    objectId: others['objectId'] ?  others['objectId']: 'RemeshUniform',
                    objectName: others['objectName'] ?  others['objectName']: 'RemeshUniform'
                }
            })

            const filtered = Object.entries({edgeFactor, iterationsCount, useProjection})
            .filter( ([k,v]) => v != undefined)
            .reduce((acc, [k,v]) => ({...acc, ...{[k]: v}}), {});

            Object.assign(this, filtered)
        }
    }

    @Flux({
        pack: pack,
        namespace: ModuleRemeshUniform,
        id: "ModuleRemeshUniform",
        displayName: "Uniform",
        description: "Uniform re-meshing",
        resources: {
            'technical doc': `${pack.urlCDN}/dist/docs/modules/lib_remesh_uniform_module.moduleremeshuniform.html`,
            'A remeshing approach to multiresolution modeling': `https://www.graphics.rwth-aachen.de/media/papers/remeshing1.pdf`
        }
    })
    @BuilderView({
        namespace: ModuleRemeshUniform,
        icon: svgRemeshIcon
    })
    export class Module extends RemeshBase<PersistentData> {
        constructor(params) {
            super(params, "remesh uniform", remeshSurface)
        }
    }

    function remeshSurface({ args, taskId, context, workerScope }:{
        args: WorkerArguments<PersistentData>, 
        taskId: string,
        workerScope: any,
        context: WorkerContext
    }) {
        let pmpModule = workerScope["PmpModule"]
        let typedPositions = Array.from(args.positions)
        let typedIndexes = Array.from(args.indexes)
        let surface = pmpModule.buildSurface(typedPositions, typedIndexes)
        let mean = surface.meanEdgeLength()
        surface.uniformRemesh(mean * args.config.edgeFactor, args.config.iterationsCount, args.config.useProjection)
        return { positions: surface.position(), indexes: surface.index()}
    }
}
