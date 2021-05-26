import { pack } from './main';
import { Property, Flux, BuilderView, Pipe, Schema, Context} from '@youwol/flux-core'
import *  as _ from 'lodash'
import { RemeshBase, RemeshConfiguration, svgRemeshIcon } from './remesh-base.module';
import { IPmpMeshImplementation, PmpMesh } from './types.pmp';

/**
 * ## Description 
 * 
 *  Implicit Laplacian surface mesh smoothing
 * 
 * ## Technical details
 * 
 * More information can be found:
 * -    [pmp class documentation](https://www.pmp-library.org/classpmp_1_1_surface_smoothing.html)
 * -    Mathieu Desbrun, Mark Meyer, , Peter Schröder, and Alan H. Barr. 
 * Implicit fairing of irregular meshes using diffusion and curvature flow. 
 * In Proceedings of SIGGRAPH, pages 317–324, 1999.
 * -   Misha Kazhdan, Justin Solomon, and Mirela Ben-Chen. 
 * Can mean‐curvature flow be modified to be non‐singular? Computer Graphics Forum, 31(5), 2012.
 */
export namespace ModuleRemeshImplicitSmoothing {

    @Schema({
        pack: pack
    })
    export class PersistentData extends RemeshConfiguration {

        /**
         * Time step
         */
        @Property({ description: "Time step" })
        readonly timestep: number = 0.001

        /**
         * Whether or not to use uniform Laplace
         */
        @Property({ description: "Whether or not to use uniform Laplace" })
        readonly useUniformLaplace: boolean = false

        /**
         * Whether or not to rescale
         */
        @Property({ description: "Whether or not to rescale" })
        readonly rescale: boolean = true


        constructor({ timestep, useUniformLaplace, rescale, ...others }:
            {
                timestep?: number, useUniformLaplace?: boolean, rescale?: boolean, others?: any
            } = {}) {
                
                super( {
                    ...others,
                    ...{ 
                        objectId: others['objectId'] ?  others['objectId']: 'RemeshSmoothed',
                        objectName: others['objectName'] ?  others['objectName']: 'RemeshSmoothed'
                    }
                })
    
                const filtered = Object.entries({ timestep, useUniformLaplace, rescale})
                .filter( ([_,v]) => v != undefined)
                .reduce((acc, [k,v]) => ({...acc, ...{[k]: v}}), {});
    
                Object.assign(this, filtered)
        }
    }

    @Flux({
        pack: pack,
        namespace: ModuleRemeshImplicitSmoothing,
        id: "ModuleRemeshImplicitSmoothing",
        displayName: "Implicit Smoothing",
        description: "Implicit Laplacian surface mesh smoothing",
        resources: {
            'technical doc': `${pack.urlCDN}/dist/docs/modules/lib_remesh_smoothing_implicit_module.moduleremeshimplicitsmoothing.html`
        }
    })
    @BuilderView({
        namespace: ModuleRemeshImplicitSmoothing,
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
        surface.implicitSmoothing( config.timestep, config.useUniformLaplace, config.rescale)
        return surface
    }
}
