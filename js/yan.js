import { Effect, Webcam, Image, Player, Module, VideoRecorder, ImageCapture, Dom } from "https://cdn.jsdelivr.net/npm/@banuba/webar/dist/BanubaSDK.browser.esm.min.js"

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
        clientToken: "0EOuU5qV8q+n5lu5i2ewrzRKfl6KoEI4M7W1GH3HmBnIrkvZ5UFkfyXBArfdDPJ+ruILLhDjOrIbQji4RQLoFqZ6zIvTZOOVAcdrM/qGgzdNiv1jLHq12mexlUOOm7mxDBeuccYFsN5AggiYDzhEQAD42AxMTvFOvMP+3tmO8h9yOzUbFjK4AlOFL0jWE703NrxoOfEs74ePct64gi/ONAJ6K1D8GLLsWUKBzXHS+hyzGqxuj9yiOJsLtoxZp2Pp2Hs/r+Id2/7WwqUx4N3+g75l5B1UwBsQv73urcNXlx4AeW+3p5opSq9L4TGg0+ZrRBvzffK5uUkZyaDTNmyca7Bxn4Xq9RAcNUtdijPckDB9Z1kGxCTsnEtYif1xEk0tEfAfowi5yzbo7N2XajwXILQu8/PoX4DpARNghaVXd49g3w8Ohwmc0o7Tek5pHZ/RIELO4rdBK9vtONV+2RsmnpXzoWRg4curzydcK+E+8VW3vUtvRFjRcS900u0Ot1JZWXhfB5x/4hTnFKzez3PKcvLzahAgNV1JNsg=",
        proxyVideoRequestsTo: isSafari ? "___range-requests___/" : null,
      }),
      // Find more about available modules:
      // https://docs.banuba.com/face-ar-sdk-v1/generated/typedoc/classes/Module.html
      Module.preload(["face_tracker", "background", "hair"].map(m => `https://cdn.jsdelivr.net/npm/@banuba/webar/dist/modules/${m}.zip`)),
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

    //#region effects
    $.each(effects, async (idx, effectName) => {
      let name = effectName
      if(effectName ==="Hipster1") {
        name = "添加口罩模型"
      }

      if(effectName ==="Hipster2") {
        name = "替换模型图片"
      }
      
      const btn = $(
        `<button >${name}</button>`
      ).prependTo("#effects")

      const effect = await Effect.preload(`effects/${effectName}.zip`)

      btn.on("click", () => player.applyEffect(effect))
      btn.removeClass("loading")
    })
    $("#reset").on("click", () => player.clearEffect())
    //#endregion


    //#region ruler
    player.addEventListener("effectactivated", ({ detail: effect }) => {
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
    }
    //#endreegion

  })()