import { pack } from './main';
import { Property, Flux, BuilderView, Pipe, Schema, Context} from '@youwol/flux-core'
import *  as _ from 'lodash'
import { RemeshBase, RemeshConfiguration, svgRemeshIcon } from './remesh-base.module';
import { IPmpMeshImplementation, PmpMesh } from './types.pmp';

/**
 * ## Description 
 * 
 *  Explicit Laplacian surface mesh smoothing
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
export namespace ModuleRemeshExplicitSmoothing {

    @Schema({
        pack: pack,
        description: "Persistent Data of RemeshExplicitSmoothing"
    })
    export class PersistentData extends RemeshConfiguration {

        /**
         * Number of iteration
         */
        @Property({ description: "Number of iteration" })
        readonly iterationCount: number = 10

        /**
         * Whether or not to use uniform Laplace
         */
        @Property({ description: "Whether or not to use uniform Laplace" })
        readonly useUniformLaplace: boolean = false


        constructor({ iterationCount, useUniformLaplace, ...others }:
            {
                iterationCount?: number, useUniformLaplace?: boolean, others?: any
            } = {}) {
                super( {
                    ...others,
                    ...{ 
                        objectId: others['objectId'] ?  others['objectId']: 'RemeshSmoothed',
                        objectName: others['objectName'] ?  others['objectName']: 'RemeshSmoothed'
                    }
                })
    
                const filtered = Object.entries({iterationCount, useUniformLaplace})
                .filter( ([_,v]) => v != undefined)
                .reduce((acc, [k,v]) => ({...acc, ...{[k]: v}}), {});
    
                Object.assign(this, filtered)
        }
    }

    @Flux({
        pack: pack,
        namespace: ModuleRemeshExplicitSmoothing,
        id: "ModuleRemeshExplicitSmoothing",
        displayName: "Explicit Smoothing",
        description: "Laplacian surface mesh smoothing",
        resources: {
            'technical doc': `${pack.urlCDN}/dist/docs/modules/lib_remesh_smoothing_explicit_module.moduleremeshexplicitsmoothing.html`
        }
    })
    @BuilderView({
        namespace: ModuleRemeshExplicitSmoothing,
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
        surface.explicitSmoothing( config.iterationCount, config.useUniformLaplace)
        return surface
    }
}
