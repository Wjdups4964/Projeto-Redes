import { iniciarCamadaAplicacao } from './application.js'
import { camadas } from './aplicacao.js'

const descricaoTitulo = document.querySelector('#descricao-titulo')
const descricaoTexto = document.querySelector('#descricao-camada')
const secoesCamada = document.querySelectorAll('.camada')

function atualizarDescricao(camada) {
  const dados = camadas[camada]
  if (!dados) return
  if (descricaoTitulo) descricaoTitulo.textContent = dados.titulo
  if (descricaoTexto) descricaoTexto.textContent = dados.descricao
}

function selecionarCamada(camada) {
  const secao = document.querySelector(`#camada-${camada}`)
  if (secao) {
    secao.classList.add('ativa')
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'))
    })
  }
  atualizarDescricao(camada)
}

function inicializar() {
  iniciarCamadaAplicacao()
  selecionarCamada('aplicacao')
}

document.addEventListener('DOMContentLoaded', inicializar)
