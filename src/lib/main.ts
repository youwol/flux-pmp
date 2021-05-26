import { FluxPack, IEnvironment } from '@youwol/flux-core'
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { AUTO_GENERATED } from '../auto_generated'


export var pmp

export function install(environment: IEnvironment){

    return environment.fetchJavascriptAddOn([
        `@youwol/flux-pmp#${AUTO_GENERATED.version}~assets/pmp.js`
    ]).pipe( 
        mergeMap( () => {
            return new Observable(subscriber => {
                window["PmpModule"]['onRuntimeInitialized'] = () => { subscriber.next(true); subscriber.complete(); }
              });
        }),
        tap( () => pmp = window["PmpModule"] )
    )
}

export let pack = new FluxPack({
    ...AUTO_GENERATED,
    ...{
        install
    }
})

