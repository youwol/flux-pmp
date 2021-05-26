
import { pack } from './main';
import { Property, Flux, BuilderView, Pipe, Schema, Context} from '@youwol/flux-core'
import *  as _ from 'lodash'
import { RemeshBase, RemeshConfiguration, svgRemeshIcon } from './remesh-base.module';
import { IPmpMeshImplementation, PmpMesh } from './types.pmp';

/**
 * ## Description 
 * 
 * Perform uniform surface remeshing.
 * 
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
    export class PersistentData extends RemeshConfiguration{

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
            'technical doc': `${pack.urlCDN}/dist/docs/modules/lib_remesh_uniform_module.moduleremeshuniform.html`
        }
    })
    @BuilderView({
        namespace: ModuleRemeshUniform,
        icon: svgRemeshIcon
    })
    export class Module extends RemeshBase<PersistentData> {
        constructor(params) {
            super(params, remeshSurface)
        }
    }

    function remeshSurface(
        positions: Float32Array, 
        indexes: Uint16Array,
        config: PersistentData, 
        pmpModule: any
        ): IPmpMeshImplementation {

        let typedPositions = Array.from(positions)
        let typedIndexes = Array.from(indexes)

        let surface = pmpModule.buildSurface(typedPositions, typedIndexes)
        let mean = surface.meanEdgeLength()
        surface.uniformRemesh(mean * config.edgeFactor, config.iterationsCount, config.useProjection)

        return surface
    }

}
