/**
 * ==================================
 * eLISAschool - Stabilisation DOM pour export
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Attend que le DOM d'un élément se stabilise (plus de mutation pendant
 * `calmeMs`), avec un plafond dur `timeoutMs`. Utilisé après « tout déplier »
 * ou après un montage forcé (minimap) : fiable quel que soit le nombre
 * de nœuds, contrairement à un setTimeout fixe.
 * Extrait dans lib/export/ pour réutilisation par tout module d'export.
 */

/**
 * Attend que le DOM de l'élément se stabilise (plus de mutation pendant
 * `calmeMs`), avec un plafond dur `timeoutMs`.
 */
export function attendreStabilisationDom(
    element: HTMLElement,
    calmeMs = 250,
    timeoutMs = 3000,
): Promise<void> {
    return new Promise(resolve => {
        const observer = new MutationObserver(() => {
            window.clearTimeout(timerCalme);
            timerCalme = window.setTimeout(terminer, calmeMs);
        });

        const terminer = (): void => {
            observer.disconnect();
            window.clearTimeout(timerCalme);
            window.clearTimeout(timerPlafond);
            resolve();
        };

        let timerCalme = window.setTimeout(terminer, calmeMs);
        const timerPlafond = window.setTimeout(terminer, timeoutMs);

        observer.observe(element, { childList: true, subtree: true, attributes: true });
    });
}
