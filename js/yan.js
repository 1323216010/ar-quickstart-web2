import { Effect, Webcam, Player, Module, Dom } from "https://cdn.jsdelivr.net/npm/@banuba/webar/dist/BanubaSDK.browser.esm.min.js"

const effects = [
  "Hipster2",
  "Hipster1"
]

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
/** @see https://docs.banuba.com/face-ar-sdk-v1/web/web_known_issues#effect-animations-are-delayed-on-safari for details */
if (isSafari) navigator.serviceWorker.register("./range-requests.sw.js"); 
(async () => {
    let lock = $("select")[0].value
    let source

    const [player, modules] = await Promise.all([
      Player.create({
        clientToken: "Qk5CIEv3NqPBD1XD9ECF6usFXQmeKdu+qODvk9GtVZ+nB5FCwCaaEOGvZdpJ3AnyBc7+xgycq114RCMVHgrx+cARLJqNjTBzIkqcuTzdn8n9709QF+Ef4QMu2GP6eb5XboVsle+eSmZeLGKv7k3YYXuky9fxjzQFfdCXMAx7O5xbwk9itnSBfxoNJzxEF5doHFrQ5F1SAj+D3cZyEQgPsDYBuGF52Im9/QRR5EpjHj89Urt/yQ0xIWWZMvRDr39szCXoDTAfY3EsGQUt/suj4jiT9Qr6zXC/Cw==",
/*         proxyVideoRequestsTo: isSafari ? "___range-requests___/" : null, */
      }),
      // Find more about available modules:
      // https://docs.banuba.com/face-ar-sdk-v1/generated/typedoc/classes/Module.html
      Module.preload(["face_tracker"].map(m => `/effects/face_tracker.zip`)),
    ])

    await player.addModule(...modules)

    //#region fps lock
    $("select").dropdown({
      onChange: (fps) => {
        lock = fps
        if (source) player.use(source, { fps: lock })
      }
    })
    //#endregion

    //#region source
/*     $("#source-image").on("change", e => {
      source?.stop?.()
      source = new Image(e.target.files[0])
      player.use(source, { fps: lock })
      Dom.render(player, "#webar")
    }) */
    $("#source-webcam").on("click", e => {
      source?.stop?.()
      source = new Webcam()
      player.use(source, { fps: lock })
      Dom.render(player, "#webar")
    })
    //#endregion

    //#region fps count
    const fps = {
      cam: 0,
      processing: 0,
      render: 0,
    }
    player.addEventListener("framereceived", () => fps.cam++)
    player.addEventListener("frameprocessed", ({ detail }) => fps.processing = 1. / detail.averagedDuration)
    player.addEventListener("framerendered", () => fps.render++)

    setInterval(() => {
      Object
        .entries(fps)
        .forEach(([name, value]) => {
          fps[name] = 0
          $(`#${name}`).text(value.toFixed(1))
        })
    }, 1000)
    //#endregion

    var face_low_BaseColor2 = await Effect.preload(`/effects/face_low_BaseColor2.zip`)
    //#region effects
    $.each(effects, async (idx, effectName) => {
      let name;
      if(effectName ==="Hipster1") {
        name = "原始模型"
      }

      if(effectName ==="Hipster2") {
        name = "替换贴图"
      }
      
      const btn = $(
        `<button class="ui primary button elastic loading">${name}</button>`
      ).prependTo("#effects")

      const effect = await Effect.preload(`/effects/Hipster1.zip`)

      if(effectName === 'Hipster2') {
        effect._resource._data['images/face_low_BaseColor.png'] = face_low_BaseColor2._resource._data['face_low_BaseColor.png']
      }
      btn.on("click", () => player.applyEffect(effect))
      btn.removeClass("loading")
    })
    $("#reset").on("click", () => player.clearEffect())
    //#endregion


    //#region ruler
/*     player.addEventListener("effectactivated", ({ detail: effect }) => {
      const isRuler = effect.scene().getName() === "ruler"

      player.removeEventListener("framedata", onFrameData)

      if (isRuler) player.addEventListener("framedata", onFrameData)

      $("output").text("")
    })

    function onFrameData({ detail: frameData }) {
      const face = frameData
        .getFrxRecognitionResult()
        ?.getFaces()
        .get(0)
        .hasFace()

      if (!face) return

      const distance = frameData.getRuler()

      $("output").text(`Distance: ${distance.toFixed(2)}`)
    } */
    //#endreegion

  })()