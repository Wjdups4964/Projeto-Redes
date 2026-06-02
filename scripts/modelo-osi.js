import { iniciarCamadaAplicacao } from './application.js'
import { camadas } from './aplicacao.js'

const botoesCamada = document.querySelectorAll('.osi-layer-btn')
const descricaoTitulo = document.querySelector('#descricao-titulo')
const descricaoTexto = document.querySelector('#descricao-camada')
const secoesCamada = document.querySelectorAll('.camada')

function esconderCamadas() {
  secoesCamada.forEach(secao => secao.classList.remove('ativa'))
}

function atualizarDescricao(camada) {
  const dados = camadas[camada]
  if (!dados) return
  if (descricaoTitulo) descricaoTitulo.textContent = dados.titulo
  if (descricaoTexto) descricaoTexto.textContent = dados.descricao
}

function selecionarCamada(camada) {
  botoesCamada.forEach(botao => botao.classList.toggle('ativo', botao.dataset.camada === camada))
  esconderCamadas()
  const secao = document.querySelector(`#camada-${camada}`)
  if (secao) secao.classList.add('ativa')
  atualizarDescricao(camada)
}

function inicializar() {
  iniciarCamadaAplicacao()
  botoesCamada.forEach(botao => {
    botao.addEventListener('click', () => selecionarCamada(botao.dataset.camada))
  })
  selecionarCamada('aplicacao')
}

document.addEventListener('DOMContentLoaded', inicializar)
