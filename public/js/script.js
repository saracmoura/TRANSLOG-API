// ============================================================================
// FRONT-END SPA (public/js/script.js): Integração Completa com as Sprints 1 a 5
// ============================================================================

// Captura a referência do visor <pre> compartilhado entre todas as abas
const visorJson = document.getElementById("visorJson");
// Captura a referência do selo superior que exibe o Código de Status HTTP
const badgeStatusHttp = document.getElementById("badgeStatusHttp");
// Captura o campo editável do Bearer Token no cabeçalho
const inputTokenApi = document.getElementById("inputTokenApi");

// Salva o valor inicial do Token no LocalStorage caso ainda não exista um salvo
if (!localStorage.getItem("token_translog")) {
    // Grava o token padrão na memória local do navegador
    localStorage.setItem("token_translog", inputTokenApi.value);
} // Fecha a inicialização do LocalStorage

// Preenche o campo visual do cabeçalho com o token armazenado no LocalStorage
inputTokenApi.value = localStorage.getItem("token_translog");

// Escuta qualquer digitação no campo de Token para manter o LocalStorage sempre atualizado
inputTokenApi.addEventListener("input", () => {
    // Atualiza o token salvo no navegador removendo espaços extras nas pontas
    localStorage.setItem("token_translog", inputTokenApi.value.trim());
}); // Fecha o evento de atualização do Token

// Função auxiliar que exibe o JSON no visor e ajusta as cores conforme a Família HTTP (2xx, 4xx ou 5xx)
function exibirRespostaNoVisor(conteudo, statusHttp) {
    // Verifica se o status pertence às famílias de erro (4xx Erro do Cliente ou 5xx Erro do Servidor)
    if (statusHttp >= 400 || statusHttp === 0) {
        // Aplica cor de texto vermelha clara no visor escuro para destacar o erro
        visorJson.className = "json-viewer text-danger p-3 m-0 rounded-bottom";
        // Pinta o selo superior de vermelho (bg-danger)
        badgeStatusHttp.className = "badge bg-danger";
        // Exibe o número do status de erro no selo (ou falha de conexão se status for 0)
        badgeStatusHttp.textContent = statusHttp === 0 ? "Falha de Conexão" : `Status HTTP: ${statusHttp} (Erro)`;
    } else {
        // Aplica cor de texto azul-clara (text-info) para respostas da família de sucesso (2xx)
        visorJson.className = "json-viewer text-info p-3 m-0 rounded-bottom";
        // Pinta o selo superior de verde (bg-success)
        badgeStatusHttp.className = "badge bg-success";
        // Exibe o número do status de sucesso no selo (ex: 200, 201 ou 204)
        badgeStatusHttp.textContent = `Status HTTP: ${statusHttp} (Sucesso)`;
    } // Fecha o bloco condicional de cores

    // Converte o objeto JavaScript para texto JSON formatado com indentação de 2 espaços
    visorJson.textContent = JSON.stringify(conteudo, null, 2);
} // Fecha a função exibirRespostaNoVisor

// Função auxiliar que monta os cabeçalhos HTTP corretos para cada tipo de requisição
function montarCabecalhos(incluirContentTypeJson = false, incluirAuthorization = false) {
    // Inicia o objeto exigindo resposta exclusivamente em formato application/json
    const headers = { "Accept": "application/json" };
    // Se a requisição levar dados no Request Body (POST, PUT ou PATCH), declara Content-Type
    if (incluirContentTypeJson) {
        // Adiciona a etiqueta obrigatória para acionar o express.json() no Back-End
        headers["Content-Type"] = "application/json";
    } // Fecha a verificação de Content-Type
    // Se a rota exigir autenticação (rotas de escrita/exclusão), anexa o Bearer Token
    if (incluirAuthorization) {
        // Resgata o token salvo no LocalStorage e monta o padrão Bearer
        headers["Authorization"] = `Bearer ${localStorage.getItem("token_translog")}`;
    } // Fecha a verificação de Authorization
    // Devolve o objeto de cabeçalhos pronto para o fetch()
    return headers;
} // Fecha a função montarCabecalhos

// Função auxiliar que lê a resposta da API de forma segura (mesmo se o Back-End retornar texto puro)
async function lerRespostaComSeguranca(respostaHttp) {
    // Extrai o corpo bruto da resposta como texto
    const textoBruto = await respostaHttp.text();
    // Se a resposta vier vazia (ex: 204 No Content), retorna null
    if (!textoBruto) return null;
    // Tenta executar o JSON.parse() manualmente sobre o texto recebido
    try {
        // Converte o texto JSON em objeto JavaScript vivo
        return JSON.parse(textoBruto);
    } catch {
        // Se o Back-End devolveu um erro em HTML/texto fora do padrão JSON, encapsula para diagnóstico
        return { aviso: "A resposta do servidor não veio em formato JSON válido.", respostaBruta: textoBruto };
    } // Fecha o bloco try/catch de leitura segura
} // Fecha a função lerRespostaComSeguranca

// Seleciona todos os botões de abas do Bootstrap para limpar a tela ao alternar de Sprint
const botoesDeAba = document.querySelectorAll('button[data-bs-toggle="tab"]');
// Percorre cada botão de aba registrando um ouvinte de troca
botoesDeAba.forEach((botao) => {
    // Dispara sempre que uma nova aba termina de abrir na tela
    botao.addEventListener("shown.bs.tab", () => {
        // Restaura a cor padrão azul-clara do visor JSON
        visorJson.className = "json-viewer text-info p-3 m-0 rounded-bottom";
        // Limpa o texto do visor aguardando a próxima ação do aluno
        visorJson.textContent = "Aguardando disparo da requisição nesta aba...";
        // Restaura o selo de status para cinza neutro
        badgeStatusHttp.className = "badge bg-secondary";
        // Restaura o texto inicial do selo
        badgeStatusHttp.textContent = "Aguardando Requisição";
        // Oculta o formulário de 2º passo da aba PUT para exigir nova consulta por ID
        document.getElementById("formPutSalvar").classList.add("d-none");
        // Oculta o formulário de 2º passo da aba PATCH para exigir nova consulta por ID
        document.getElementById("formPatchSalvar").classList.add("d-none");
    }); // Fecha o evento shown.bs.tab
}); // Fecha o laço forEach das abas

// ============================================================================
// SPRINT 1: MÉTODO GET (Listar Frota / Filtrar Categoria e Buscar por ID)
// ============================================================================

// Registra o evento de envio do formulário de listagem geral e filtro por categoria
document.getElementById("formGetLista").addEventListener("submit", async (evento) => {
    // Impede o recarregamento padrão da página HTML
    evento.preventDefault();
    // Lê o valor digitado no campo de categoria removendo espaços extras
    const ds_categoria = document.getElementById("getCategoria").value.trim();
    // Monta a URL com Query Parameter (?ds_categoria=...) apenas se o campo foi preenchido
    const url = ds_categoria ? `/api/veiculos?ds_categoria=${encodeURIComponent(ds_categoria)}` : "/api/veiculos";

    // Abre o bloco try/catch para capturar erros de rede (ex: servidor desligado)
    try {
        // Dispara a requisição HTTP GET solicitando exclusivamente application/json
        const resposta = await fetch(url, { method: "GET", headers: montarCabecalhos(false, false) });
        // Desserializa o pacote JSON retornado pelo Back-End
        const dados = await lerRespostaComSeguranca(resposta);
        // Renderiza o resultado e o código HTTP (esperado: 200 OK) no visor compartilhado
        exibirRespostaNoVisor(dados, resposta.status);
    } catch (erro) {
        // Exibe o erro de conexão caso o servidor Node.js não esteja em execução
        exibirRespostaNoVisor({ erro: "Não foi possível conectar ao servidor Back-End.", detalhe: erro.message }, 0);
    } // Fecha o try/catch do GET geral
}); // Fecha o evento do formGetLista

// Registra o evento de envio do formulário de busca individual por id_veiculo
document.getElementById("formGetPorId").addEventListener("submit", async (evento) => {
    // Impede o recarregamento padrão da página
    evento.preventDefault();
    // Lê o identificador único digitado pelo usuário
    const id_veiculo = document.getElementById("getIdVeiculo").value.trim();

    // Abre o bloco try/catch para comunicação com o servidor
    try {
        // Dispara o verbo GET enviando o Route Parameter (:id) na extremidade da URL
        const resposta = await fetch(`/api/veiculos/${id_veiculo}`, { method: "GET", headers: montarCabecalhos(false, false) });
        // Lê o retorno JSON (200 OK se encontrar, 400 se ID inválido ou 404 se não existir)
        const dados = await lerRespostaComSeguranca(resposta);
        // Renderiza o pacote de retorno no visor compartilhado
        exibirRespostaNoVisor(dados, resposta.status);
    } catch (erro) {
        // Exibe mensagem de falha de rede caso o servidor esteja offline
        exibirRespostaNoVisor({ erro: "Falha de comunicação com o servidor.", detalhe: erro.message }, 0);
    } // Fecha o try/catch do GET por ID
}); // Fecha o evento do formGetPorId

// ============================================================================
// SPRINT 2: MÉTODO POST (Cadastrar Novo Veículo na tabela tb_veiculos)
// ============================================================================

// Registra o evento de envio do formulário de criação POST
document.getElementById("formPost").addEventListener("submit", async (evento) => {
    // Impede o recarregamento padrão do formulário
    evento.preventDefault();
    // Lê o texto digitado no campo de quilometragem inicial
    const valorKmDigitado = document.getElementById("postKm").value;

    // Constrói o objeto JavaScript vivo com os nomes mnemônicos exatos da tabela tb_veiculos
    const novoVeiculo = {
        // Captura a placa informada
        cd_placa: document.getElementById("postPlaca").value.trim(),
        // Captura o modelo informado
        nm_modelo: document.getElementById("postModelo").value.trim(),
        // Captura a categoria informada
        ds_categoria: document.getElementById("postCategoria").value.trim(),
        // Converte o valor da diária para formato numérico decimal
        vl_diaria_frete: Number(document.getElementById("postDiaria").value),
        // Converte a quilometragem para número inteiro (ou assume 0 se vier vazio)
        qt_quilometragem: valorKmDigitado !== "" ? parseInt(valorKmDigitado, 10) : 0
    }; // Fecha a construção do objeto novoVeiculo

    // Abre o bloco try/catch para disparo da requisição POST
    try {
        // Dispara o método POST com Content-Type: application/json, Authorization e Body serializado
        const resposta = await fetch("/api/veiculos", {
            // Define o verbo HTTP de criação
            method: "POST",
            // Inclui Accept, Content-Type: application/json e Authorization: Bearer
            headers: montarCabecalhos(true, true),
            // Aplica JSON.stringify() para congelar o objeto em String plana no Request Body
            body: JSON.stringify(novoVeiculo)
        }); // Fecha a chamada fetch POST

        // Desempacota a resposta (esperado: 201 Created, ou 409 Conflict para placa duplicada)
        const dados = await lerRespostaComSeguranca(resposta);
        // Exibe a resposta no visor compartilhado
        exibirRespostaNoVisor(dados, resposta.status);
    } catch (erro) {
        // Exibe mensagem de falha de rede caso ocorra queda na comunicação
        exibirRespostaNoVisor({ erro: "Falha ao enviar cadastro POST.", detalhe: erro.message }, 0);
    } // Fecha o try/catch do POST
}); // Fecha o evento do formPost

// ============================================================================
// SPRINT 3: MÉTODO PUT (Passo 1: Buscar por ID | Passo 2: Substituição Total)
// ============================================================================

// Passo 1 do PUT: Consulta os dados atuais pelo id_veiculo via GET e preenche o formulário
document.getElementById("formPutBusca").addEventListener("submit", async (evento) => {
    // Impede o recarregamento padrão da página
    evento.preventDefault();
    // Lê o id_veiculo informado para consulta prévia
    const id_veiculo = document.getElementById("putBuscaId").value.trim();

    // Abre o bloco try/catch para buscar o veículo no MySQL
    try {
        // Aciona a rota GET /api/veiculos/:id da Sprint 1
        const resposta = await fetch(`/api/veiculos/${id_veiculo}`, { method: "GET", headers: montarCabecalhos(false, false) });
        // Lê o JSON retornado pelo Back-End
        const pacote = await lerRespostaComSeguranca(resposta);

        // Verifica se a consulta retornou Status 200 OK
        if (resposta.status === 200 && pacote) {
            // Extrai o objeto do veículo de dentro de pacote.dados (padrão VeiculoView) ou da raiz
            const veiculo = pacote.dados || pacote;
            // Preenche o campo de placa com o valor atual do banco
            document.getElementById("putPlaca").value = veiculo.cd_placa ?? "";
            // Preenche o campo de modelo com o valor atual do banco
            document.getElementById("putModelo").value = veiculo.nm_modelo ?? "";
            // Preenche o campo de categoria com o valor atual do banco
            document.getElementById("putCategoria").value = veiculo.ds_categoria ?? "";
            // Preenche o campo de diária com o valor atual do banco
            document.getElementById("putDiaria").value = veiculo.vl_diaria_frete ?? "";
            // Preenche o campo de quilometragem com o valor atual do banco
            document.getElementById("putKm").value = veiculo.qt_quilometragem ?? 0;
            // Revela o formulário do 2º passo removendo a classe d-none
            document.getElementById("formPutSalvar").classList.remove("d-none");
        } else {
            // Caso o ID não exista (404), mantém o formulário do 2º passo oculto
            document.getElementById("formPutSalvar").classList.add("d-none");
        } // Fecha a verificação de status 200

        // Mostra os dados buscados (ou o erro 404) no visor compartilhado
        exibirRespostaNoVisor(pacote, resposta.status);
    } catch (erro) {
        // Exibe falha de conexão no visor
        exibirRespostaNoVisor({ erro: "Falha ao consultar dados para o PUT.", detalhe: erro.message }, 0);
    } // Fecha o try/catch da busca do PUT
}); // Fecha o evento do formPutBusca

// Passo 2 do PUT: Envia todos os campos preenchidos para substituição completa no MySQL
document.getElementById("formPutSalvar").addEventListener("submit", async (evento) => {
    // Impede o recarregamento padrão da página
    evento.preventDefault();
    // Resgata o id_veiculo que será enviado na URL do PUT
    const id_veiculo = document.getElementById("putBuscaId").value.trim();

    // Monta o objeto completo contendo obrigatoriamente todas as colunas da tabela tb_veiculos
    const veiculoCompleto = {
        // Placa atualizada
        cd_placa: document.getElementById("putPlaca").value.trim(),
        // Modelo atualizado
        nm_modelo: document.getElementById("putModelo").value.trim(),
        // Categoria atualizada
        ds_categoria: document.getElementById("putCategoria").value.trim(),
        // Valor de diária convertido para número decimal
        vl_diaria_frete: Number(document.getElementById("putDiaria").value),
        // Quilometragem convertida para número inteiro
        qt_quilometragem: parseInt(document.getElementById("putKm").value, 10)
    }; // Fecha o objeto veiculoCompleto

    // Abre o bloco try/catch para envio da requisição PUT
    try {
        // Dispara o verbo PUT enviando o ID na URL e o pacote completo serializado no Body
        const resposta = await fetch(`/api/veiculos/${id_veiculo}`, {
            // Define o verbo HTTP de substituição total
            method: "PUT",
            // Envia Accept, Content-Type: application/json e Authorization: Bearer
            headers: montarCabecalhos(true, true),
            // Serializa o documento completo com JSON.stringify()
            body: JSON.stringify(veiculoCompleto)
        }); // Fecha a chamada fetch PUT

        // Lê a resposta JSON devolvida pela API (200 OK, 400, 404, 409 ou 422)
        const dados = await lerRespostaComSeguranca(resposta);
        // Exibe o resultado no visor compartilhado
        exibirRespostaNoVisor(dados, resposta.status);
    } catch (erro) {
        // Exibe mensagem de falha de conexão no visor
        exibirRespostaNoVisor({ erro: "Falha ao executar substituição PUT.", detalhe: erro.message }, 0);
    } // Fecha o try/catch do salvamento PUT
}); // Fecha o evento do formPutSalvar

// ============================================================================
// SPRINT 4: MÉTODO PATCH (Passo 1: Consultar KM | Passo 2: Atualizar Apenas KM)
// ============================================================================

// Passo 1 do PATCH: Busca o registro pelo id_veiculo para exibir o KM atual (somente leitura)
document.getElementById("formPatchBusca").addEventListener("submit", async (evento) => {
    // Impede o recarregamento padrão da página
    evento.preventDefault();
    // Lê o id_veiculo informado pelo usuário
    const id_veiculo = document.getElementById("patchBuscaId").value.trim();

    // Abre o bloco try/catch para consultar o hodômetro atual
    try {
        // Reutiliza a rota GET /api/veiculos/:id para obter os dados atuais
        const resposta = await fetch(`/api/veiculos/${id_veiculo}`, { method: "GET", headers: montarCabecalhos(false, false) });
        // Lê o pacote JSON retornado
        const pacote = await lerRespostaComSeguranca(resposta);

        // Verifica se o registro foi encontrado (200 OK)
        if (resposta.status === 200 && pacote) {
            // Extrai o objeto do veículo a partir de pacote.dados ou da raiz
            const veiculo = pacote.dados || pacote;
            // Preenche o campo somente leitura com a quilometragem atual salva no MySQL
            document.getElementById("patchKmAtual").value = veiculo.qt_quilometragem ?? 0;
            // Sugere o valor atual no campo de nova quilometragem para facilitar a edição
            document.getElementById("patchNovaKm").value = veiculo.qt_quilometragem ?? 0;
            // Revela o formulário do 2º passo removendo a classe d-none
            document.getElementById("formPatchSalvar").classList.remove("d-none");
        } else {
            // Caso o ID não seja encontrado, mantém o 2º passo oculto
            document.getElementById("formPatchSalvar").classList.add("d-none");
        } // Fecha a verificação de status 200

        // Exibe a resposta da consulta no visor compartilhado
        exibirRespostaNoVisor(pacote, resposta.status);
    } catch (erro) {
        // Exibe erro de conexão caso o servidor esteja inacessível
        exibirRespostaNoVisor({ erro: "Falha ao consultar hodômetro para o PATCH.", detalhe: erro.message }, 0);
    } // Fecha o try/catch da busca do PATCH
}); // Fecha o evento do formPatchBusca

// Passo 2 do PATCH: Envia exclusivamente o campo qt_quilometragem no Request Body
document.getElementById("formPatchSalvar").addEventListener("submit", async (evento) => {
    // Impede o recarregamento padrão da página
    evento.preventDefault();
    // Lê o id_veiculo alvo para compor a URL da rota específica
    const id_veiculo = document.getElementById("patchBuscaId").value.trim();

    // Monta um pacote JSON enxuto contendo exclusivamente a coluna qt_quilometragem
    const cargaParcial = {
        // Converte a nova quilometragem para número inteiro
        qt_quilometragem: parseInt(document.getElementById("patchNovaKm").value, 10)
    }; // Fecha o objeto de carga parcial

    // Abre o bloco try/catch para envio da requisição PATCH
    try {
        // Dispara o verbo PATCH para a rota dedicada /api/veiculos/:id/quilometragem
        const resposta = await fetch(`/api/veiculos/${id_veiculo}/quilometragem`, {
            // Define o verbo HTTP de atualização parcial
            method: "PATCH",
            // Envia Accept, Content-Type: application/json e Authorization: Bearer
            headers: montarCabecalhos(true, true),
            // Serializa apenas a chave qt_quilometragem no Body (economia de banda)
            body: JSON.stringify(cargaParcial)
        }); // Fecha a chamada fetch PATCH

        // Lê a resposta JSON retornada pelo servidor
        const dados = await lerRespostaComSeguranca(resposta);
        // Se a atualização teve sucesso (200 OK), atualiza também o campo visual de KM atual
        if (resposta.status === 200) {
            // Sincroniza o campo somente leitura com a nova quilometragem confirmada
            document.getElementById("patchKmAtual").value = cargaParcial.qt_quilometragem;
        } // Fecha a atualização visual do KM atual

        // Exibe o resultado no visor compartilhado
        exibirRespostaNoVisor(dados, resposta.status);
    } catch (erro) {
        // Exibe falha de conexão no visor
        exibirRespostaNoVisor({ erro: "Falha ao executar atualização PATCH.", detalhe: erro.message }, 0);
    } // Fecha o try/catch do salvamento PATCH
}); // Fecha o evento do formPatchSalvar

// ============================================================================
// SPRINT 5: MÉTODO DELETE (Exclusão pelo ID na URL sem Body e retorno 204)
// ============================================================================

// Registra o evento de envio do formulário de exclusão DELETE
document.getElementById("formDelete").addEventListener("submit", async (evento) => {
    // Impede o recarregamento padrão da página
    evento.preventDefault();
    // Captura o id_veiculo que será enviado na URL como alvo da exclusão
    const id_veiculo = document.getElementById("deleteId").value.trim();

    // Abre o bloco try/catch para disparar o comando DELETE
    try {
        // Dispara o método DELETE sem enviar a propriedade body e sem Content-Type
        const resposta = await fetch(`/api/veiculos/${id_veiculo}`, {
            // Define o verbo HTTP de exclusão
            method: "DELETE",
            // Envia apenas Accept e Authorization (sem Content-Type pois não há corpo)
            headers: montarCabecalhos(false, true)
        }); // Fecha a chamada fetch DELETE

        // Verifica se o Back-End respondeu com o padrão corporativo 204 No Content (sem corpo)
        if (resposta.status === 204) {
            // Exibe a confirmação visual no visor sem invocar resposta.json()
            exibirRespostaNoVisor(
                {
                    // Informa o status recebido do servidor
                    status: "204 No Content",
                    // Confirma qual id_veiculo foi removido da tabela tb_veiculos
                    mensagem: `O registro id_veiculo ${id_veiculo} foi excluído com sucesso. O servidor não enviou corpo JSON nesta resposta.`
                },
                // Passa o código numérico 204 para pintar o selo de verde
                204
            ); // Fecha a exibição do 204
        } else {
            // Para qualquer outro código (ex: 400, 401, 404 ou 500), lê o JSON de erro devolvido
            const dadosErro = await lerRespostaComSeguranca(resposta);
            // Exibe o erro em vermelho no visor compartilhado
            exibirRespostaNoVisor(dadosErro, resposta.status);
        } // Fecha a verificação do status 204
    } catch (erro) {
        // Exibe falha de rede caso o servidor não responda
        exibirRespostaNoVisor({ erro: "Falha ao executar exclusão DELETE.", detalhe: erro.message }, 0);
    } // Fecha o try/catch do DELETE
}); // Fecha o evento do formDelete