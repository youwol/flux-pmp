import { pack } from './main';
import { Property, Flux, BuilderView, Pipe, Schema, Context} from '@youwol/flux-core'
import *  as _ from 'lodash'
import { RemeshBase, RemeshConfiguration, svgRemeshIcon } from './remesh-base.module';
import { IPmpMeshImplementation, PmpMesh } from './types.pmp';

/**
 * ## Description 
 * 
 * Perform adaptive surface remeshing.
 * 
 * ## Technical details
 * 
 * More information can be found:
 * -    [pmp class documentation](https://www.pmp-library.org/classpmp_1_1_surface_remeshing.html)
 * -    Original article: Marion Dunyach, David Vanderhaeghe, Loïc Barthe, and Mario Botsch. Adaptive remeshing for real-time mesh deformation. 
 * In Eurographics 2013 - Short Papers, pages 29–32, 2013.
 */
export namespace ModuleAdaptiveRemesh {

    /**
     * ## Description
     * 
     * Parameters for the surface re-meshing parameters.
     * 
     * Detailed description can be found here:
     * -    Marion Dunyach, David Vanderhaeghe, Loïc Barthe, and Mario Botsch. Adaptive remeshing for real-time mesh deformation. 
     * In Eurographics 2013 - Short Papers, pages 29–32, 2013.
     */
    @Schema({
        pack: pack
    })
    export class PersistentData extends RemeshConfiguration{

        /**
         * Factor that defines re-meshing smaller edge length w/ mean original object's edge length
         */
        @Property({ description: "Factor that defines re-meshing smaller edge length w/ mean original object's edge length" })
        readonly minEdgeFactor: number = 0.5

        /**
         * Factor that defines re-meshing biggest edge length w/ mean original object's edge length
         */
        @Property({ description: "Factor that defines re-meshing biggest edge length w/ mean original object's edge length" })
        readonly maxEdgeFactor: number = 2

        /**
         * Define approximation error
         */
        @Property({ description: "Define approximation error" })
        readonly approxError: number = 0.1

        /**
         * Number of iteration
         */
        @Property({ description: "Number of iteration" })
        readonly iterationsCount: number = 10

        /**
         * Wether or not to use projection
         */
        @Property({ description: "Wether or not to use projection" })
        readonly useProjection: boolean = true

        constructor({ minEdgeFactor, maxEdgeFactor, approxError, iterationsCount, useProjection, ...others }:
            {
                minEdgeFactor?: number, maxEdgeFactor?: number, approxError?: number, iterationsCount?: number, useProjection?: boolean,
                multiThreaded?: boolean, others?: any
            } = {}) {

                super( {
                    ...others,
                    ...{ 
                        objectId: others['objectId'] ?  others['objectId']: 'RemeshAdaptive',
                        objectName: others['objectName'] ?  others['objectName']: 'RemeshAdaptive'
                    }
                })
    
                const filtered = Object.entries({ minEdgeFactor, maxEdgeFactor, approxError, iterationsCount, useProjection})
                .filter( ([_,v]) => v != undefined)
                .reduce((acc, [k,v]) => ({...acc, ...{[k]: v}}), {});
    
                Object.assign(this, filtered)
        }
    }

    @Flux({
        pack: pack,
        namespace: ModuleAdaptiveRemesh,
        id: "ModuleAdaptiveRemesh",
        displayName: "Adaptive",
        description: "Adaptive re-mesh",
        resources: {
            'technical doc': `${pack.urlCDN}/dist/docs/modules/lib_remesh_adaptive_module.moduleadaptiveremesh.html`
        }
    })
    @BuilderView({
        namespace: ModuleAdaptiveRemesh,
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

        surface.adaptiveRemesh( mean * config.minEdgeFactor, mean * config.maxEdgeFactor, config.approxError, config.iterationsCount,config.useProjection )
        return surface
    }
}
