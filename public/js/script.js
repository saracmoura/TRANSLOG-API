// ============================================================================ //
// ARQUIVO JS (public/js/script.js): Automação de Formulários e Chamadas Fetch  //
// ============================================================================ //

// Armazena o Crachá de Segurança (Bearer Token) no LocalStorage do navegador do aluno
// Na vida real, isso ocorreria após uma tela de login bem-sucedida. O HTTP não tem memória (Stateless).
localStorage.setItem("token_lojatech", "token-secreto-senai");

// Localiza e guarda em memória a referência do elemento <pre> (Terminal Compartilhado)
const visorJson = document.getElementById("visorJson");

// ----------------------------------------------------------------------------
// FUNÇÃO AUXILIAR: Exibir JSON formatado e alterar cor baseado no Status Code
// ----------------------------------------------------------------------------
function mostrarResposta(dadosReaisJson, codigoStatusHttp) {
    // Se a API devolver falha (Família 400 ou 500)
    if (codigoStatusHttp >= 400) {
        // Altera a classe CSS do visor para vermelho (Alarme de Erro)
        visorJson.className = "json-viewer bg-danger bg-opacity-10 text-danger p-3 m-0";
    } else {
        // Se a API devolver Sucesso (Família 200), mantém a cor de terminal (fundo escuro, texto azul)
        visorJson.className = "json-viewer bg-dark text-info p-3 m-0";
    }
    // Converte o objeto JavaScript em texto (Serialização) aplicando 2 espaços de indentação para formatação visual
    visorJson.textContent = JSON.stringify(dadosReaisJson, null, 2);
}

// ----------------------------------------------------------------------------
// FUNÇÃO AUXILIAR: Fornecer os metadados (Cabeçalhos HTTP) para o Fetch API
// ----------------------------------------------------------------------------
function obterHeaders() {
    return {
        // Negociação de Conteúdo: Exige que a resposta volte estritamente em JSON (Aceita pelo Middleware)
        "Accept": "application/json",
        // Declaração de Carga: Avisa ao servidor que o corpo (Body) está em JSON
        "Content-Type": "application/json",
        // Envio do Crachá: Resgata o token da memória e injeta no cabeçalho de Autorização
        "Authorization": "Bearer " + localStorage.getItem("token_lojatech")
    };
}

// ----------------------------------------------------------------------------
// LIMPANDO A TELA: Evento disparado quando o aluno troca de aba (Nav-Tabs)
// ----------------------------------------------------------------------------
// Seleciona todos os botões que alternam as abas da tela
const botoesAbas = document.querySelectorAll('button[data-bs-toggle="tab"]');
// Percorre cada botão adicionando um "espião"
botoesAbas.forEach(aba => {
    // Ouve o evento nativo do Bootstrap 'shown.bs.tab', ativado quando a aba aparece totalmente
    aba.addEventListener('shown.bs.tab', () => {
        // Restaura as cores padrão do visor
        visorJson.className = "json-viewer bg-dark text-info p-3 m-0";
        // Apaga o resultado da aba anterior
        visorJson.textContent = "Aguardando nova requisição HTTP...";
        
        // Esconde (adiciona a classe d-none) os formulários de Salvamento (Passo 2) das abas PUT e PATCH
        // Isso obriga o aluno a buscar o ID novamente antes de editar.
        document.getElementById("formPutSalvar").classList.add("d-none");
        document.getElementById("formPatchSalvar").classList.add("d-none");
    });
});

// ============================================================================ //
// LÓGICA SPRINT 1: MÉTODO GET (Listar todos e Filtrar por Categoria)           //
// ============================================================================ //
document.getElementById("formGet").addEventListener("submit", async (evento) => {
    // Evita que o navegador recarregue a página (Comportamento de Single Page Application)
    evento.preventDefault();
    
    // Captura o valor digitado no campo de filtro
    const dsCategoriaFiltro = document.getElementById("getCategoria").value.trim();
    // Monta a base da URL oficial
    let urlEndpoint = "/api/produtos";
    
    // Se o usuário digitou uma categoria, nós acoplamos o "Query Parameter" na URL
    if (dsCategoriaFiltro !== "") {
        urlEndpoint += `?ds_categoria=${dsCategoriaFiltro}`;
    }

    try {
        visorJson.textContent = "Viajando até o servidor para executar o SELECT (GET)...";
        // Dispara a requisição HTTP GET usando a Fetch API nativa do JS
        const requisicao = await fetch(urlEndpoint, {
            method: "GET",
            // GET não usa body, passa apenas o cabeçalho exigindo JSON
            headers: { "Accept": "application/json" }
        });
        
        // Executa JSON.parse() na String que voltou do servidor, transformando em objeto
        const pacoteDesempacotado = await requisicao.json();
        // Chama a função auxiliar para desenhar o resultado no terminal
        mostrarResposta(pacoteDesempacotado, requisicao.status);
    } catch (erro) {
        visorJson.textContent = "Falha crítica de rede ou servidor desligado: " + erro.message;
    }
});

// ============================================================================ //
// LÓGICA SPRINT 2: MÉTODO POST (Cadastrar novo registro no banco)              //
// ============================================================================ //
document.getElementById("formPost").addEventListener("submit", async (evento) => {
    evento.preventDefault();

    // Cria um Objeto JavaScript reunindo todos os dados preenchidos, utilizando os mnemônicos como chaves
    const novoObjetoProduto = {
        cd_sku: document.getElementById("postSku").value,
        nm_produto: document.getElementById("postNome").value,
        ds_categoria: document.getElementById("postCategoria").value,
        vl_preco: Number(document.getElementById("postPreco").value),
        // Se a caixa estoque ficar vazia, converte pra 0
        qt_estoque: Number(document.getElementById("postEstoque").value) || 0
    };

    // Congela o Objeto vivo convertendo-o numa String JSON para viagem (Serialização)
    const cargaBodySerializada = JSON.stringify(novoObjetoProduto);

    try {
        visorJson.textContent = "Enviando carga pesada com método POST...";
        // Dispara a requisição, agora com o verbo POST, Headers de Auth e o Body JSON
        const requisicao = await fetch("/api/produtos", {
            method: "POST",
            headers: obterHeaders(),
            body: cargaBodySerializada
        });

        // Desempacota o retorno (Status 201 Created se der certo, ou 409 Conflict se duplicar a placa)
        const pacoteDesempacotado = await requisicao.json();
        mostrarResposta(pacoteDesempacotado, requisicao.status);
    } catch (erro) {
        visorJson.textContent = "Falha de conexão: " + erro.message;
    }
});

// ============================================================================ //
// LÓGICA SPRINT 3: MÉTODO PUT (Passo 1: Buscar ID no banco)                    //
// ============================================================================ //
document.getElementById("formPutBusca").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    // Identifica qual registro o aluno deseja editar
    const idDesejado = document.getElementById("putId").value;

    try {
        visorJson.textContent = `Puxando dados do produto ID ${idDesejado} no servidor (GET)...`;
        // Aproveita o verbo GET para ler os dados atuais no servidor
        const requisicao = await fetch(`/api/produtos/${idDesejado}`, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        const respostaConvertida = await requisicao.json();

        // Se o servidor confirmou que o registro existe (Status 200 OK)
        if (requisicao.status === 200) {
            // Extrai o objeto do caminhão de dentro do pacote de sucesso
            const produtoOriginal = respostaConvertida.dados;

            // Injeta as informações originais nos campos de texto para que o usuário não edite às cegas
            document.getElementById("putSku").value = produtoOriginal.cd_sku;
            document.getElementById("putNome").value = produtoOriginal.nm_produto;
            document.getElementById("putCategoria").value = produtoOriginal.ds_categoria;
            document.getElementById("putPreco").value = produtoOriginal.vl_preco;
            document.getElementById("putEstoque").value = produtoOriginal.qt_estoque;

            // Remove a classe "d-none" do formulário de salvamento, revelando-o na tela
            document.getElementById("formPutSalvar").classList.remove("d-none");
            
            // Informa ao aluno que a busca deu certo
            mostrarResposta({ aviso: "Dados importados do banco! Modifique o que quiser e clique em Salvar." }, 200);
        } else {
            // Se ocorreu falha (Ex: 404 ID Inexistente), oculta o 2º passo e exibe o erro
            document.getElementById("formPutSalvar").classList.add("d-none");
            mostrarResposta(respostaConvertida, requisicao.status);
        }
    } catch (erro) {
        visorJson.textContent = "Falha de busca: " + erro.message;
    }
});

// ============================================================================ //
// LÓGICA SPRINT 3: MÉTODO PUT (Passo 2: Transmitir a Sobrescrita Total)        //
// ============================================================================ //
document.getElementById("formPutSalvar").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    // Resgata o ID de lá da primeira caixinha de busca
    const idAlvoUrl = document.getElementById("putId").value;

    // A arquitetura PUT exige que todos os campos obrigatórios sejam reenviados
    const objetoCompletoSubstituto = {
        cd_sku: document.getElementById("putSku").value,
        nm_produto: document.getElementById("putNome").value,
        ds_categoria: document.getElementById("putCategoria").value,
        vl_preco: Number(document.getElementById("putPreco").value),
        qt_estoque: Number(document.getElementById("putEstoque").value)
    };

    try {
        visorJson.textContent = "Executando processo de Sobrescrita Completa (PUT)...";
        // Dispara o comando PUT anexando o :id na URL e o pacote gigante no Body
        const requisicao = await fetch(`/api/produtos/${idAlvoUrl}`, {
            method: "PUT",
            headers: obterHeaders(),
            body: JSON.stringify(objetoCompletoSubstituto)
        });

        const respostaConvertida = await requisicao.json();
        mostrarResposta(respostaConvertida, requisicao.status);
    } catch (erro) {
        visorJson.textContent = "Falha de comunicação: " + erro.message;
    }
});

// ============================================================================ //
// LÓGICA SPRINT 4: MÉTODO PATCH (Passo 1: Buscar Estoque Atual)                //
// ============================================================================ //
document.getElementById("formPatchBusca").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const idDesejado = document.getElementById("patchId").value;

    try {
        visorJson.textContent = `Lendo qt_estoque do Produto ID ${idDesejado}...`;
        const requisicao = await fetch(`/api/produtos/${idDesejado}`, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        const respostaConvertida = await requisicao.json();

        // Se localizou
        if (requisicao.status === 200) {
            // Exibe exclusivamente a quantidade do estoque no campo que será editado cirurgicamente
            document.getElementById("patchEstoque").value = respostaConvertida.dados.qt_estoque;
            // Revela a área de remendo
            document.getElementById("formPatchSalvar").classList.remove("d-none");
            mostrarResposta({ aviso: "Estoque resgatado! Faça a edição cirúrgica e salve." }, 200);
        } else {
            document.getElementById("formPatchSalvar").classList.add("d-none");
            mostrarResposta(respostaConvertida, requisicao.status);
        }
    } catch (erro) {
        visorJson.textContent = "Falha na busca: " + erro.message;
    }
});

// ============================================================================ //
// LÓGICA SPRINT 4: MÉTODO PATCH (Passo 2: Transmitir a Carga Parcial)          //
// ============================================================================ //
document.getElementById("formPatchSalvar").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const idAlvoUrl = document.getElementById("patchId").value;
    
    // O trunfo arquitetural do PATCH: o payload JSON viaja muito mais leve!
    // Ele leva apenas a coluna qt_estoque, poupando a placa, o nome e os valores originais.
    const pequenoPacoteRemendo = {
        qt_estoque: Number(document.getElementById("patchEstoque").value)
    };

    try {
        visorJson.textContent = "Executando Atualização Cirúrgica de Estoque (PATCH)...";
        // Atenção à Rota Especializada: /api/produtos/:id/estoque
        const requisicao = await fetch(`/api/produtos/${idAlvoUrl}/estoque`, {
            method: "PATCH",
            headers: obterHeaders(),
            body: JSON.stringify(pequenoPacoteRemendo)
        });

        const respostaConvertida = await requisicao.json();
        mostrarResposta(respostaConvertida, requisicao.status);
    } catch (erro) {
        visorJson.textContent = "Falha no remendo cirúrgico: " + erro.message;
    }
});

// ============================================================================ //
// LÓGICA SPRINT 5: MÉTODO DELETE (Ordem Definitiva de Destruição)              //
// ============================================================================ //
document.getElementById("formDelete").addEventListener("submit", async (evento) => {
    evento.preventDefault();

    // Lê o ID que sofrerá a exclusão definitiva
    const idAlvoDestruicao = document.getElementById("deleteId").value;

    try {
        visorJson.textContent = "Enviando ordem oficial de Exclusão (DELETE)...";
        
        // Ao contrário dos outros verbos de escrita, o DELETE raramente utiliza o Body da requisição.
        // A ordem de destruição é identificada inteiramente pela presença do ID na própria URL.
        const requisicao = await fetch(`/api/produtos/${idAlvoDestruicao}`, {
            method: "DELETE",
            // Apenas o crachá de autorização viaja no pacote
            headers: { 
                "Authorization": "Bearer " + localStorage.getItem("token_lojatech")
            }
        });

        // Quando o Back-End executa o DELETE com maestria, ele devolve o status 204 No Content.
        // A regra do protocolo HTTP proíbe devolver JSON num pacote 204. Ele vem completamente vazio.
        if (requisicao.status === 204) {
            mostrarResposta(
                { 
                    status: "204 No Content", 
                    mensagem: `O registro do ID ${idAlvoDestruicao} foi deletado e o servidor não devolveu JSON.` 
                }, 
                204 // Código passado forçosamente para manter a tela azul
            );
        } else {
            // Se ocorreu falha e a API devolveu um erro (Ex: 404 ID não existe), ele converte e exibe o JSON do erro
            const pacoteDeErro = await requisicao.json();
            mostrarResposta(pacoteDeErro, requisicao.status);
        }
    } catch (erro) {
        visorJson.textContent = "Falha gravíssima na comunicação: " + erro.message;
    }
});