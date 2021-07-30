
import { pack } from './main';
import { Property, Flux, BuilderView, Schema} from '@youwol/flux-core'
import *  as _ from 'lodash'
import { RemeshBase, svgRemeshIcon, WorkerArguments } from './remesh-base.module';
import { IPmpMeshImplementation } from './types.pmp';

import * as FluxThree from '@youwol/flux-three'
import { WorkerContext } from '@youwol/flux-core/src/lib/worker-pool';
/**
 * ## Description 
 * 
 * Surface mesh simplification based on approximation error and fairness criteria.
 * 
 * ## Technical details
 * 
 * More information can be found:
 * -    [pmp class documentation](https://www.pmp-library.org/classpmp_1_1_surface_simplification.html)
 * -    Leif Kobbelt, Swen Campagna, and Hans-Peter Seidel. A general framework for mesh decimation.
 *  In Proceedings of Graphics Interface, pages 43–50, 1998.
 * -    Michael Garland and Paul Seagrave Heckbert. Surface simplification using quadric error metrics. 
 * In Proceedings of the 24th Annual Conference on Computer Graphics and Interactive Techniques, SIGGRAPH '97, pages 209–216, 1997.
 */
export namespace ModuleRemeshSimplify {

    @Schema({
        pack: pack
    })
    export class PersistentData extends FluxThree.Schemas.Object3DConfiguration {

        
        /** 
         * Factor that defines the resolution compared to the original surface
         */
        @Property({ description: "Factor that defines the resolution compared to the original surface" })
        readonly resolutionFactor: number = 1

        /**
         * Factor that defines remeshing edge length w/ mean original surface
         */
        @Property({ description: "Factor that defines remeshing edge length w/ mean original surface" })
        readonly edgeFactor: number = 1

        /**
         * Aspect ratio
         */
        @Property({ description: "Aspect ratio" })
        readonly aspectRatio: number = 0

        /**
         * Maximum valence
         */
        @Property({ description: "Maximum valence" })
        readonly maxValence: number = 0

        /**
         * Normal deviation
         */
        @Property({ description: "Normal deviation" })
        readonly normalDeviation: number = 0

        /**
         * Hausdorff error
         */
        @Property({ description: "Hausdorff error" })
        readonly error: number = 0

        constructor({ resolutionFactor, edgeFactor, aspectRatio, maxValence, normalDeviation, error, ...others }:
            {
                resolutionFactor?: number, edgeFactor?: number, aspectRatio?: number, maxValence?: number, error?: number,
                normalDeviation?: number, others?: any
            } = {}) {

                super( {
                    ...others,
                    ...{ 
                        objectId: others['objectId'] ?  others['objectId']: 'RemeshSimplify',
                        objectName: others['objectName'] ?  others['objectName']: 'RemeshSimplify'
                    }
                })
    
                const filtered = Object.entries({resolutionFactor, edgeFactor, aspectRatio, maxValence, normalDeviation, error})
                .filter( ([_,v]) => v != undefined)
                .reduce((acc, [k,v]) => ({...acc, ...{[k]: v}}), {});
    
                Object.assign(this, filtered)
        }
    }

    @Flux({
        pack: pack,
        namespace: ModuleRemeshSimplify,
        id: "ModuleRemeshSimplify",
        displayName: "Simplify",
        description: "Surface mesh simplification based on approximation error and fairness criteria",
        resources: {
            'technical doc': `${pack.urlCDN}/dist/docs/modules/lib_remesh_simplify_module.moduleremeshsimplify.html`
        }
    })
    @BuilderView({
        namespace: ModuleRemeshSimplify,
        icon: svgRemeshIcon
    })
    export class Module extends RemeshBase<PersistentData> {

        constructor(params) {
            super(params, "Remesh-simplify", remeshSurface)
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
        let edgeLength = surface.meanEdgeLength() * args.config.edgeFactor
        let vertexCount = surface.nbVertices() * args.config.resolutionFactor
        surface.simplify( vertexCount, args.config.aspectRatio, edgeLength, args.config.maxValence, 
            args.config.normalDeviation, args.config.error )
        return { positions: surface.position(), indexes: surface.index()}
    }
}
