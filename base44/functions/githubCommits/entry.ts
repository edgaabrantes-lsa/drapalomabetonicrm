import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { repo, owner, per_page = 30 } = await req.json().catch(() => ({}));

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("github");

    // Se não foi passado repo/owner, lista os repositórios do usuário
    if (!repo || !owner) {
      const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        }
      });
      const repos = await reposRes.json();
      return Response.json({ repos: repos.map(r => ({ id: r.id, name: r.name, full_name: r.full_name, owner: r.owner.login, description: r.description, updated_at: r.updated_at, default_branch: r.default_branch })) });
    }

    // Busca commits do repositório
    const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=${per_page}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      }
    });
    const commits = await commitsRes.json();

    if (!Array.isArray(commits)) {
      return Response.json({ error: commits.message || 'Erro ao buscar commits' }, { status: 400 });
    }

    // Estatísticas de contribuidores
    const statsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/stats/contributors`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      }
    });
    const stats = await statsRes.json().catch(() => []);

    const formattedCommits = commits.map(c => ({
      sha: c.sha?.substring(0, 7),
      message: c.commit?.message?.split('\n')[0],
      author: c.commit?.author?.name,
      author_avatar: c.author?.avatar_url,
      date: c.commit?.author?.date,
      url: c.html_url,
    }));

    const contributors = Array.isArray(stats) ? stats.map(s => ({
      login: s.author?.login,
      avatar: s.author?.avatar_url,
      total: s.total,
    })).sort((a, b) => b.total - a.total).slice(0, 10) : [];

    return Response.json({ commits: formattedCommits, contributors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});