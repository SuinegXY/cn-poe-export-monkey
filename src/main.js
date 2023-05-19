import "./assets/main.css"

import { createApp } from "vue"
import Exporter from "./Exporter.vue"

const container = document.createElement("div")
container.id = "exportContainer"
document.body.appendChild(container)

createApp(Exporter).mount("#exportContainer")
