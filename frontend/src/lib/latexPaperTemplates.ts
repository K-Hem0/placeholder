/**
 * Raw LaTeX bodies for note templates. Add more keys here (e.g. homework, proof, article)
 * and wire them in `noteTemplateConfig` when those flows exist.
 */
export const LATEX_RESEARCH_PAPER_SKELETON = String.raw`\documentclass[11pt]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage{amsmath,amssymb,amsthm}
\usepackage{graphicx}
\usepackage{booktabs}
\usepackage{hyperref}
\usepackage[numbers,sort&compress]{natbib}

\title{Your Paper Title}
\author{Your Name}
\date{\today}

\begin{document}

\maketitle

\begin{abstract}
% Summarize the problem, approach, and key findings in 150--250 words.
\end{abstract}

\section{Introduction}
% Motivation, scope, and how this paper is organized.

\section{Background}
% Prior work and definitions the reader needs.

\section{Main Argument}
% Your central claim and reasoning.

\section{Evidence}
% Data, experiments, lemmas, or citations that support the argument.

\section{Conclusion}
% Takeaways, limitations, and future work.

\bibliographystyle{plainnat}
\bibliography{references}

\end{document}
`
