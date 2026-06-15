export const camadas = {
  aplicacao: {
    titulo: 'Camada de Aplicação',
    descricao: 'Responsável pelos protocolos de rede e pela interface com o usuário. Detecta SMTP/POP e abre o formulário de email.'
  },
  apresentacao: {
    titulo: 'Camada de Apresentação',
    descricao: 'Exibe os dados processados pela camada de aplicação com criptografia aplicada.'
  }
}


// Camadas adicionais adicionadas para o modelo OSI (apenas metadados/descritivos)
camadas.sessao = {
  titulo: 'Camada de Sessão',
  descricao: 'Gerencia sessões e controle de diálogo entre aplicações.'
}

camadas.transporte = {
  titulo: 'Camada de Transporte',
  descricao: 'Responsável pelo transporte de segmentos com controle de fluxo e portas (ex: TCP/UDP).'
}

camadas.rede = {
  titulo: 'Camada de Rede',
  descricao: 'Encapsula segmentos em pacotes com endereçamento lógico (IP) e roteamento.'
}

camadas.enlace = {
  titulo: 'Camada de Enlace de Dados',
  descricao: 'Forma quadros (frames) com endereçamento físico (MAC) e controle de acesso.'
}


