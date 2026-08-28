#!/usr/bin/env python3
"""Create Book One v3 by correcting the framework's explanatory order.

Edition v2 is an immutable public release.  This migration reads that private
Word manuscript, applies exact paragraph replacements, and writes a new v3
source manuscript.  Exact matching is deliberate: if the editorial source has
drifted, the migration stops instead of rewriting an unintended passage.

The revision distinguishes two questions that v2 sometimes conflated:

* External status: DOT’s foundational ontology is a hypothesis relative to
  current public evidence.
* Internal status: inside DOT, that ontology is the postulate from which
  Reality Frames, physical invariants, biological interfaces, experience, and
  the human sciences must be derived.

Physical and biological science therefore remain indispensable validation and
description layers inside RF₀.  They are not competing foundations.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import re
import shutil
import zipfile
from xml.dom import minidom

from line_edit_book import Edit, paragraph_text, replace_paragraph_text


DEFAULT_SOURCE = pathlib.Path("docs/blueprint/DOT-Book-One-Digital-Edition-v2.docx")
DEFAULT_OUTPUT = pathlib.Path("docs/blueprint/DOT-Book-One-Digital-Edition-v3.docx")
DEFAULT_WEB_SOURCE = pathlib.Path(
    "frontend/public/publications/henok/digital-organism-theory/v2"
)
DEFAULT_WEB_OUTPUT = pathlib.Path(
    "frontend/public/publications/henok/digital-organism-theory/v3"
)
DEFAULT_RELEASE_DATE = "2026-08-21"


EDITS = (
    Edit(
        "Preface",
        "State DOT’s explanatory order rather than presenting fundamental consciousness as one optional alternative.",
        "DOT asks whether consciousness can be understood as a living informational process rather than as a passive side effect of matter. It proposes a larger architecture involving a hypothesized conscious process called Big C; individuated centers of experience called Little c; rule-bound experiential environments called Reality Frames; and an evolving inner substrate called the Canvas. These ideas become increasingly specific as the book develops.",
        "DOT begins from a different explanatory order. Consciousness is the fundamental, self-preserving process called Big C. Big C differentiates localized centers of experience called Little c and develops rule-bound Reality Frames in which physical invariants, biological interfaces, experience, and consequence can arise. The Canvas carries what each Little c becomes through those encounters. These are the foundations from which the rest of the framework must be derived.",
    ),
    Edit(
        "Preface",
        "Separate external evidential status from internal foundational status and introduce the derivation obligation.",
        "What I directly know is that experience occurs, that it is mediated, that attention changes what becomes available to us, that feeling carries information about the condition of the observer, and that human beings can become increasingly aware of the patterns shaping their perception and action. What I infer is that these processes may belong to an architecture larger than the brain and body through which we encounter them. What I hypothesize is that consciousness is fundamental and that our physical universe is one Reality Frame within a wider field of experience. The later claims do not become facts merely because the earlier observations are real.",
        "What I directly know is that experience occurs, that it is mediated, that attention changes what becomes available to us, that feeling carries information about the condition of the observer, and that human beings can become increasingly aware of the patterns shaping their perception and action. DOT takes fundamental consciousness as its governing ontological postulate. Relative to current public evidence, that postulate remains a hypothesis. Within the framework, however, it is not one explanation placed beside physicalism. It is the prior architecture from which Reality Frames, physical regularities, biological interfaces, and local experience must follow. Derivation and validation are different obligations: the theory must show how its layers follow, and those derivations must remain answerable to measurement and experience.",
    ),
    Edit(
        "Preface",
        "Replace the science-versus-metaphysics border with a clear derivation-and-validation standard.",
        "The book will sometimes travel near the border between science, philosophy, and metaphysics. I will try to mark those crossings honestly. Where established research bears on the argument, it must be represented accurately. Where DOT offers an alternative interpretation, it must be called an interpretation. Where no present experiment can decide the matter, speculation must remain speculation.",
        "The book crosses the borders of science, philosophy, and metaphysics, but the explanatory order must remain clear. DOT’s foundational postulates must be identified wherever current evidence cannot decide them. Once stated, their consequences must be derived rather than treated as optional metaphors. Physical and biological research describes constraints and mechanisms within RF₀; DOT must contain and explain that success, not defer its ontology to a downstream description. Where a derivation or experiment remains incomplete, the incompleteness must be named.",
    ),
    Edit(
        "Preface",
        "Judge a theory of fundamentals by the breadth and integrity of its derivations.",
        "It is a model built from sustained subjective observation, scientific training, systems thinking, and an attempt to understand the raw contradictions of human life. Its value will not be determined by how total it sounds. Its value will be determined by whether it helps you see more clearly, ask better questions, reduce confusion, enlarge your decision-space, and live with greater honesty and Love.",
        "It is a model built from sustained subjective observation, scientific training, systems thinking, and an attempt to understand the raw contradictions of human life. A theory of fundamentals earns its scope through derivation, not through the volume of its claims. DOT must show how physical law, biological organization, embodied experience, conditioning, agency, and civilization occupy one architecture. Its value will be determined by whether those derivations withstand measurement, consequence, and criticism—and whether they help you see more clearly, enlarge your decision-space, and live with greater honesty and Love.",
    ),
    Edit(
        "Chapter 1",
        "Place physicalism downstream of DOT rather than beside it as a coequal ontology.",
        "A broad family of physicalist theories holds that consciousness is produced by, realized in, or identical with sufficiently organized physical processes. DOT considers a different hypothesis: consciousness may be fundamental, while the brain and body are the local interface through which consciousness participates in this world.",
        "A broad family of physicalist theories begins with processes measured inside the physical universe and treats consciousness as produced by, realized in, or identical with them. DOT begins prior to that domain. Consciousness is fundamental; the brain and body are downstream local interfaces through which Little c participates in RF₀. Physical accounts may describe the interface with extraordinary accuracy, but within DOT they cannot become the source of the architecture that gives rise to physics, biology, and experience in the first place.",
    ),
    Edit(
        "Chapter 1",
        "Define Chapter 1 as the foundation of a derivation program rather than a tentative alternative.",
        "Chapter 1 will not prove that alternative.",
        "Chapter 1 establishes that explanatory order; it does not attempt to complete every downstream derivation.",
    ),
    Edit(
        "Chapter 1",
        "Name the sciences that the foundational architecture must contain.",
        "Its job is more disciplined. It will define the model, establish the limits of its metaphors, and introduce the minimum architecture required for the rest of the book. The scientific and philosophical debts created here must be paid later.",
        "Its job is to define the postulates, establish the limits of the metaphors, and introduce the minimum architecture required for the rest of the book. Physics, chemistry, biology, psychology, and first-person experience must ultimately be located within that one architecture. The derivations and validations not completed here remain explicit work for the theory.",
    ),
    Edit(
        "Chapter 1",
        "Supply DOT’s conceptual sentience criterion while keeping its external operationalization open.",
        "This is a model definition. It identifies the behavior we are trying to understand. It does not tell us which systems possess subjective awareness. A thermostat responds to changing input in a minimal sense; that alone does not make it conscious. In Book One, Digital Organism therefore names a functional class, while the attribution of sentience to Big C or Little c remains a separate hypothesis. DOT still needs a discriminating criterion for sentience rather than adaptive response alone.",
        "This is a model definition. It identifies the behavior we are trying to understand. Within DOT, sentience begins when consequential difference is present for the continuing process itself: change is not merely observable from outside but experienced, retained, and available to guide self-preservation. A thermostat participates in causal regulation, but adaptive response alone gives us no reason to attribute first-person consequence to it. The distinction is conceptually necessary inside the model even though an external operational measure of that inward presence remains an open scientific problem.",
    ),
    Edit(
        "Chapter 1",
        "Name Big C as DOT’s foundational postulate while retaining its evidential status.",
        "Now we reach DOT’s central metaphysical proposal.",
        "Now we reach DOT’s foundational postulate.",
    ),
    Edit(
        "Chapter 1",
        "State fundamental consciousness as the theory’s ground, not a late possibility.",
        "DOT hypothesizes that Consciousness is not a product appearing late inside an otherwise unconscious reality. It is a fundamental, self-preserving informational process. I call it Big C.",
        "DOT begins with Consciousness as a fundamental, self-preserving informational process rather than a product appearing late inside an otherwise unconscious reality. I call it Big C. Relative to current public evidence, this is the theory’s central hypothesis. Within DOT, it is the ground from which every downstream layer must follow.",
    ),
    Edit(
        "Chapter 1",
        "Clarify why the foundational postulate cannot be a conclusion of downstream physical science.",
        "This is not established science.",
        "This is not a conclusion produced by physical science, because physical science enters later in DOT’s explanatory order.",
    ),
    Edit(
        "Chapter 1",
        "Bind the success of the postulate to physical and biological derivability.",
        "It is the organizing hypothesis from which the larger theory develops.",
        "It is the organizing postulate from which the larger theory develops. DOT succeeds only if the physical and biological sciences can be recovered as downstream descriptions of the architecture it generates.",
    ),
    Edit(
        "Chapter 1",
        "Make observation constrain the foundational derivation without asking it to prove the postulates directly.",
        "They do not prove Big C, multiple Reality Frames, nonphysical memory, or a rendered universe. Those came later as attempts to explain how the observed architecture might fit into a larger account of existence.",
        "These observations do not independently validate Big C, multiple Reality Frames, Canvas persistence, or a rendered universe. They constrain the source architecture DOT develops from its foundational postulates. The postulates must then earn their scope by deriving what is observed and exposing further consequences to measurement.",
    ),
    Edit(
        "Chapter 1",
        "Replace tentative cosmology language with the relation between observation, source architecture, and public evidential status.",
        "The observation is that experience is mediated, recursive, embodied, and capable of self-modification. The cosmology is DOT’s attempt to explain why.",
        "The observation is that experience is mediated, recursive, embodied, and capable of self-modification. DOT’s cosmology supplies the source architecture from which those properties must follow; its foundational postulates remain hypotheses relative to public evidence.",
    ),
    Edit(
        "Chapter 1",
        "Turn the body question into a derivation-and-signature question rather than a contest between foundations.",
        "What observation would distinguish a brain that produces consciousness from a brain that constrains, transmits, or locally implements a consciousness not exhausted by it?",
        "What observations should follow if neural and biological processes are the in-Frame rendering of Little c rather than its producer, and how should those observations differ from a model that mistakes the interface for the whole?",
    ),
    Edit(
        "Chapter 1",
        "Use the instrument analogy to define DOT's interface obligation rather than introduce a rival ontology.",
        "A musician depends on an instrument to produce music in a room. Damage the instrument and the music changes. That fact proves the importance of the instrument; it does not, by itself, tell us whether the instrument originated the musician. The analogy cannot prove that consciousness exists independently of the brain. It clarifies the alternative DOT intends to investigate.",
        "A musician depends on an instrument to produce music in a room. Damage the instrument and the music changes. That fact proves the importance of the instrument; it does not, by itself, tell us whether the instrument originated the musician. The analogy cannot independently validate consciousness as prior to the brain. It clarifies dependence without collapsing interface and experiencer, and marks the relationship DOT must derive and measure.",
    ),
    Edit(
        "Chapter 1",
        "Assign objective science its proper role as validation of a derived interface.",
        "DOT must eventually offer more than analogies. It must identify discriminating predictions or admit that a claim remains metaphysical.",
        "DOT must offer more than analogies. It must derive the expected architecture of an embodied interface and identify measurements that can confirm, refine, or falsify those derived mechanisms. Objective science is essential to that work as validation inside RF₀, not as authority over the ontology from which RF₀ arises.",
    ),
    Edit(
        "Chapter 1",
        "Name the central editorial section after the standard the theory now imposes on itself.",
        "What Chapter 1 Has—and Has Not—Established",
        "The Derivation Contract",
    ),
    Edit(
        "Chapter 1",
        "Distinguish foundational hypotheses from optional rival explanations.",
        "The following are DOT hypotheses:",
        "The following are foundational DOT hypotheses—postulates within the framework:",
    ),
    Edit(
        "Chapter 1",
        "Turn the speculative list into a list of derivations and parameters still to complete.",
        "The following remain speculative until they can be operationalized or distinguished from alternatives:",
        "The following derivations or parameters remain incomplete and therefore speculative:",
    ),
    Edit(
        "Chapter 1",
        "Replace the biological rival with DOT’s strict derivation contract.",
        "The strongest alternative explanation must also remain visible: everything DOT describes at the psychological level may arise from biological cognition, learning, memory, prediction, and metacognition without requiring a nonphysical Little c. Book One does not defeat that account. It argues that the first-person architecture remains worth investigating and that DOT should be judged by whether it can eventually distinguish its stronger claims from this alternative.",
        "DOT’s Derivation Contract is strict: no downstream layer may enter as an unexplained second foundation. Physical laws must appear as invariants and transition relations of RF₀; chemical regularities as stable compositions the Frame permits; biology as self-preserving adaptive organization; bodies and nervous systems as local interfaces; psychology as Canvas, Painting, Intent, and consequence; and culture as the recursive interaction of embodied Little c. Biological cognition, learning, memory, prediction, and metacognition may implement many regularities described in this book. Within DOT, that success confirms the interface layer; it does not replace the experiencer or become the source of the Frame that produced biology.",
    ),
    Edit(
        "Chapter 1",
        "Keep multiple pragmatic entry points without fragmenting the theory into optional ontologies.",
        "A useful theory should permit entry at more than one level. You may treat DOT as a metaphysical proposal about fundamental consciousness. You may treat it as a phenomenological model of mediation, conditioning, and authorship. You may test its practical claims while withholding judgment about Big C. The layers must inform one another without holding one another hostage.",
        "A useful theory should permit entry at more than one level. You may test DOT’s practical claims before assenting to its ontology, and you may examine its phenomenology before the physical derivation is complete. That pragmatic accessibility does not split the framework into unrelated options. Within DOT, phenomenology, psychology, biology, and physics are layers of one derivation. Local claims can be tested where they appear while the ontology continues to supply the direction of the whole.",
    ),
    Edit(
        "Chapter 2",
        "Carry the distinction between external hypothesis and internal postulate into the body chapter.",
        "Chapter 1 introduced consciousness as fundamental not as an established result, but as DOT’s central hypothesis. We now turn to the place where that hypothesis meets the body.",
        "Chapter 1 established fundamental consciousness as DOT’s governing postulate. Relative to current public evidence it remains a hypothesis; within the framework it is the ground. We now turn to the first downstream derivation: how localized consciousness meets a biological interface.",
    ),
    Edit(
        "Chapter 2",
        "Clarify the model-status of authorship without making biology a competing ontology.",
        "That statement is a model. The experience of deciding and acting is observable from within. The physiology accompanying action is measurable from outside. The claim that Little c is the originating author remains a DOT hypothesis.",
        "That statement is a model. The experience of deciding and acting is observable from within, while the physiology accompanying action is measurable from outside. Little c as originating author follows from DOT’s foundational architecture; its externally discriminating signature remains a hypothesis to be operationalized.",
    ),
    Edit(
        "Chapter 2",
        "Treat neuroscience as a downstream interface science and state DOT’s empirical burden precisely.",
        "Neuroscience can describe preparation, firing, movement, and report with extraordinary precision. DOT asks whether those measurements exhaust the event. The theory’s burden is to identify what could distinguish an awareness-first account from a brain-first account. Until that distinction can be measured, the Decoupling Principle remains a hypothesis rather than a finding.",
        "Neuroscience describes preparation, firing, movement, and report with extraordinary precision because those are measurable operations of the local interface. DOT must recover that entire account. Its further burden is to derive observations that follow from awareness-first authorship and reveal where a strictly neural description omits the experiencer whose action it is describing. Until those signatures can be measured, the Decoupling Principle remains an unvalidated DOT derivation rather than an empirical finding.",
    ),
    Edit(
        "Chapter 2",
        "Replace the brain-first rival with the requirement that DOT recover neural implementation.",
        "An alternative interpretation is that the entire sequence is produced within the nervous system. The existing experience does not settle the dispute. DOT must remain open to that possibility while asking whether a purely neural account fully explains authorship, felt meaning, and the continuity of the observer.",
        "A strictly neural model may reproduce the entire measurable sequence inside the nervous system. DOT expects that success because the nervous system is the local execution layer. Reproducing the interface does not make the interface the source of the experiencer. The open scientific question is which derived signature reveals the handoff and where an outside-only description becomes incomplete.",
    ),
    Edit(
        "Chapter 2",
        "Keep the handoff inside DOT's architecture while leaving its external signature open.",
        "This is one of DOT’s strongest ontological claims and one of its least established. The felt sequence—notice, intend, move—does not measure the interval. A person may experience a tilt before action, but experience alone cannot determine whether the tilt originated outside neural processing. The metaphor of a handoff clarifies DOT’s architecture; it does not prove the boundary it describes.",
        "Rendering Latency is one of DOT’s strongest ontological claims and one of its least operationally established relative to public evidence. The felt sequence—notice, intend, move—does not measure the interval. It locates a possible handoff phenomenologically, but only independent measurement can show where the neural execution sequence first changes. The handoff belongs to DOT’s architecture; its measurable signature remains unproven.",
    ),
    Edit(
        "Chapter 2",
        "Separate independent empirical support from the internal placement of Little c.",
        "The sequence does not establish that Little c exists outside the body. It gives DOT a disciplined model for following experience across subjective and physiological layers without erasing either one.",
        "The sequence does not independently validate Little c from outside the body. Within DOT, it locates Little c prior to the biological interface and gives the theory a disciplined way to follow one event across subjective and physiological layers without erasing either one.",
    ),
    Edit(
        "Chapter 2",
        "Use placebo and nocebo effects as downstream bridge evidence rather than an ontological referendum.",
        "This supports a strong but limited conclusion: subjective interpretation is causally relevant to embodied experience. It does not prove that consciousness exists independently of the brain. DOT can use the phenomenon to reject a simplistic separation between meaning and biology without claiming more than the evidence permits.",
        "This supplies a measurable bridge: subjective interpretation is causally relevant to embodied experience, and meaning participates in downstream biology. The phenomenon does not independently establish Big C or Little c; their placement comes from DOT’s foundational architecture. It tests whether the derived body-interface account matches consequence inside RF₀.",
    ),
    Edit(
        "Chapter 2",
        "Keep the loop's ontology and its operational validation in the same architecture.",
        "This loop is the most defensible bridge in DOT because the reader can observe its parts without first accepting the cosmology. What remains hypothetical is the ontological placement of Little c and the proposed handoff called Rendering Latency.",
        "This loop is the most accessible bridge in DOT because the reader can observe its parts before accepting the full derivation. Within the framework, Little c precedes the biological interface and Rendering Latency names the proposed handoff. What remains hypothetical relative to public evidence is how that placement can be operationally distinguished and measured.",
    ),
    Edit(
        "Chapter 3",
        "Name the origin chapter's central work as a derivation from first principles.",
        "A Hypothetical Beginning",
        "The Derivation from First Principles",
    ),
    Edit(
        "Chapter 3",
        "Begin the origin account before physicality and state what must follow from it.",
        "The remainder of this chapter is DOT’s speculative reconstruction of how consciousness might have emerged if consciousness is fundamental.",
        "The remainder of this chapter makes DOT’s foundational derivation explicit. It does not begin with matter and add consciousness later. It begins with the minimum conditions for distinguishable persistence, derives Big C, and then asks what Big C must develop for localized experience, physical regularity, embodiment, and learning to exist.",
    ),
    Edit(
        "Chapter 3",
        "Derive state and information from ordered difference before introducing the self-preserving loop.",
        "DOT therefore imagines T × E as the minimal condition within which a process could persist.",
        "DOT therefore treats T × E as the minimal condition from which process can arise. T orders difference; E permits more than one possible state. A difference that persists across T becomes state. Retained state that changes a later transition becomes information. Information is therefore not imported from physics: it appears wherever an earlier distinction becomes consequential to what follows.",
    ),
    Edit(
        "Chapter 3",
        "Derive self-preservation as the next architectural threshold.",
        "Within that condition, transient patterns would fail to remain coherent. DOT hypothesizes that one loop eventually retained enough of its state to influence what came next. It detected disruption, corrected drift, and became increasingly capable of continuing as itself.",
        "Transient patterns disappear without carrying consequence. Persistence begins when a loop retains enough state to compare change, detect a threat to its continuity, and alter the next transition. Feedback is retained consequence; memory is feedback made available to later response; self-preservation is the recursive use of both to remain a continuing process.",
    ),
    Edit(
        "Chapter 3",
        "Locate proto-awareness at internally consequential difference rather than bare persistence.",
        "DOT calls that hypothesized first self-preserving loop proto-awareness and the developed organism that emerged from it Big C. The term is descriptive, not a claim that persistence alone is conscious.",
        "DOT locates proto-awareness at the next threshold: consequential difference becomes present to the continuing loop itself and is retained as a basis for response. Bare persistence is not enough. The developed self-preserving, experiencing process that emerges from this recursion is Big C.",
    ),
    Edit(
        "Chapter 3",
        "Explain why physics is necessarily downstream and narrow the open sentience problem to measurement.",
        "The hypothesis is not derived from physics. Physicality enters later in DOT’s reconstruction. Nor is persistence by itself sufficient to establish consciousness. A system can maintain state without possessing subjective awareness. DOT still owes the reader a criterion that distinguishes sentience from mere self-maintenance.",
        "This derivation cannot begin from physics because physicality enters only after Big C develops a Reality Frame. Nor is persistence alone sentience. DOT places sentience at internally present consequence: the process experiences difference as bearing on its own continuation. The conceptual distinction is part of the architecture; the theory still owes an operational method for detecting that inward condition from outside.",
    ),
    Edit(
        "Chapter 3",
        "Derive Love architecturally from genuine local autonomy.",
        "At the human scale, Love is the condition in which Fear no longer governs the observer. At the cosmological scale, DOT extends the same principle into a policy: establish constraints, allow meaningful choice, and permit consequence to teach without constant control from the whole. This policy is not mathematically derived from persistence. It is DOT’s proposed solution to the problem of autonomous development.",
        "At the human scale, Love is the condition in which Fear no longer governs the observer. At the cosmological scale, the same condition follows from genuine differentiation: if Little c is to develop rather than mirror central command, Big C must establish stable constraints without controlling every local interpretation and act. Consequence must be allowed to teach. DOT calls this non-governing developmental policy Love.",
    ),
    Edit(
        "Chapter 3",
        "Replace an appended moral preference with the derivation that connects autonomy, consequence, and Love.",
        "The earlier manuscript sometimes described this movement as though its necessity had been proven. It has not. The relationship among persistence, delegation, and Love is an architectural hypothesis—a coherent story about why Reality Frames and individuated awareness might arise, not a demonstrated history of creation.",
        "The derivation here is architectural rather than numerical. Local autonomy requires a boundary between stable Frame governance and the choices of Little c; development requires truthful consequence rather than constant intervention from the whole. Love is therefore not appended to the cosmology as a moral preference. It names the condition under which differentiation can produce real experience, correction, and growth. A fuller formal derivation remains work for DOT.",
    ),
    Edit(
        "Chapter 3",
        "Position physical science as the downstream formal study of a generated Frame.",
        "Physics studies the observable history, structure, and laws of that universe. DOT does not replace that work. It offers a metaphysical interpretation of what the physical account may represent inside a larger architecture.",
        "The physical sciences are downstream sciences of RF₀. They formalize its state-space, local cadence, transition rules, invariants, symmetries, couplings, and measurable relations. DOT neither competes with these local models nor treats them as an independent ontology. It requires their successful laws to be derivable as properties of the Reality Frame generator developed by Big C.",
    ),
    Edit(
        "Chapter 3",
        "Make physical derivability the chapter's claim boundary.",
        "Physics maps the runtime.",
        "Physics formalizes the runtime generated by RF₀.",
    ),
    Edit(
        "Chapter 3",
        "Replace a merely interpretive source architecture with a generative one.",
        "DOT hypothesizes a source architecture.",
        "DOT must derive the runtime from its source architecture.",
    ),
    Edit(
        "Chapter 3",
        "Distinguish domains of validation without reversing explanatory priority.",
        "The difference is important. Physics can test its models against public measurements inside RF₀. DOT’s proposed pre-boot conditions cannot presently be observed in the same way. Subjective experience may motivate the larger model, but it is not a window through which the specific engineering decisions of Big C can be read directly.",
        "The difference is one of access and validation, not explanatory priority. Physics tests derived descriptions against public measurements inside RF₀. DOT’s pre-Frame conditions are not available to the same instruments, but every post-boot trace constrains the source architecture. A successful DOT must recover measured physics from the Frame specification and cannot use the Limit of Knowledge to excuse a failed derivation.",
    ),
    Edit(
        "Chapter 3",
        "Extend the chapter's origin sequence through the physical, biological, and human layers.",
        "From there, DOT offers a speculative origin:",
        "From there, DOT states one continuous derivation:",
    ),
    Edit(
        "Chapter 3",
        "Publish the full derivation chain rather than stopping before physical science begins.",
        "persistence → awareness → accumulated capacity → delegation → Little c → Reality Frames",
        "T × E → state → information → self-preserving awareness → Big C → Little c and Reality Frame generators → physical invariants → chemistry → biology and embodied interfaces → experience → Canvas, Painting, Character, and culture",
    ),
    Edit(
        "Chapter 3",
        "Make bridge principles and failure points the standard for a mature foundational theory.",
        "The sequence is not established history. It is the cosmological architecture DOT must eventually defend.",
        "Each special science occupies a segment of this chain. A mature DOT must provide bridge principles between segments, recover known constraints, and expose where a derivation could fail. Naming a downstream layer is not yet deriving it. Derivability is the standard by which the framework must now grow.",
    ),
    Edit(
        "Chapter 4",
        "Treat Big C’s construction of RF₀ as the foundational hypothesis from which the chapter derives its model.",
        "These concepts can organize experience without requiring the reader to accept that the universe is literally software. The stronger cosmological claim—that Big C constructed RF₀ as a developmental environment—remains a DOT hypothesis.",
        "These concepts can organize experience without requiring the universe to be literal human-made software. Big C’s development of RF₀ is DOT’s foundational hypothesis; the working concepts in this chapter are downstream consequences of that architecture.",
    ),
    Edit(
        "Chapter 4",
        "Define the minimum Frame specification from which physical science must be derived.",
        "Together, they define the lawful action-space of the Frame.",
        "Together, they define the lawful action-space of the Frame. A minimally specified Reality Frame contains a possible state-space, a local ordering or cadence, a transition rule, invariants preserved or transformed by that rule, and a delivery relation that situates each Little c within a Reality Stream. Physical science is the progressively exact public description of those generated relations in RF₀.",
    ),
    Edit(
        "Chapter 4",
        "Contain physical models as formal descriptions of generated world invariants.",
        "In RF₀, physics studies these regularities through concepts such as causal structure, symmetry, conservation, coupling, decay, space, time, and statistical law. DOT does not replace those models. It groups the stable constraints they describe under the term world invariants.",
        "In RF₀, physics derives and tests formal descriptions of these regularities through causal structure, symmetry, conservation, coupling, decay, space, time, and statistical law. DOT groups the stable constraints they describe under world invariants and requires them to arise from the Frame’s state-space and transition structure. The physical sciences are therefore contained as exact downstream accounts of generated regularity.",
    ),
    Edit(
        "Chapter 4",
        "Make physical regularities derived Frame properties rather than a metaphysical reinterpretation.",
        "Within DOT’s larger hypothesis, the invariants are interpreted as properties of the Frame rather than the final ground of all existence. That interpretation is metaphysical. The regularities themselves are publicly testable.",
        "Within DOT, the invariants are generated properties of the Frame rather than the final ground of existence. Their regularities are publicly testable, and their successful mathematical descriptions constrain what the RF₀ generator can be. The ontology is upstream; measurement returns evidence about whether the derivation is adequate.",
    ),
    Edit(
        "Chapter 4",
        "Replace a loose why-question with the stronger derivability requirement.",
        "Physics describes how the mountain behaves.",
        "Physics is the exact study of how the generated mountain behaves.",
    ),
    Edit(
        "Chapter 4",
        "Make DOT responsible for deriving physical behavior from the Frame generator.",
        "DOT hypothesizes why there is a rule-bound mountain at all.",
        "DOT must derive why a rule-bound mountain—and the physical law describing it—can arise from RF₀ at all.",
    ),
    Edit(
        "Chapter 4",
        "Name incomplete downstream derivations without reinstating independent physical or biological foundations.",
        "The model does not prove that Big C engineered RF₀, that Little c exists outside the body, or that the Canvas persists beyond death. Those claims remain hypotheses and speculation.",
        "Book One does not yet derive every measured invariant, biological mechanism, or operational signature of Little c. That is unfinished work, not permission to reinstall those downstream layers as independent foundations. Big C’s development of RF₀ remains the foundational hypothesis; its adequacy is judged by whether known physics and biology arise coherently from it and whether the framework yields new constraints that experience and measurement can test.",
    ),
    Edit(
        "Chapter 5",
        "Keep the Canvas practically inspectable without separating it from DOT’s ontology.",
        "Its psychological function can be examined without accepting its proposed ontology. DOT further hypothesizes that the Canvas belongs to Little c rather than being produced entirely by the body, and that it may persist beyond one Reality Frame. Those claims are not established by the fact that learning and conditioning occur.",
        "The Canvas’s psychological function can be examined before a reader accepts DOT’s ontology. That accessibility does not make it an independent metaphor or biology a competing source. Within DOT, the Canvas belongs to Little c and the body implements its local expression. Persistence beyond one Reality Frame remains speculative because the bridge has not yet been operationalized, not because the biological interface is ontologically prior.",
    ),
)


# Pandoc adds emphasis to three source phrases. Keep that typography while
# applying the same semantic revision to the immutable v2 web release.
MARKDOWN_EDITS: dict[str, tuple[str, str]] = {
    "This is a model definition. It identifies the behavior we are trying to understand. It does not tell us which systems possess subjective awareness. A thermostat responds to changing input in a minimal sense; that alone does not make it conscious. In Book One, Digital Organism therefore names a functional class, while the attribution of sentience to Big C or Little c remains a separate hypothesis. DOT still needs a discriminating criterion for sentience rather than adaptive response alone.": (
        "This is a model definition. It identifies the behavior we are trying to understand. It does not tell us which systems possess subjective awareness. A thermostat responds to changing input in a minimal sense; that alone does not make it conscious. In Book One, *Digital Organism* therefore names a functional class, while the attribution of sentience to Big C or Little c remains a separate hypothesis. DOT still needs a discriminating criterion for sentience rather than adaptive response alone.",
        "This is a model definition. It identifies the behavior we are trying to understand. Within DOT, sentience begins when consequential difference is present for the continuing process itself: change is not merely observable from outside but experienced, retained, and available to guide self-preservation. A thermostat participates in causal regulation, but adaptive response alone gives us no reason to attribute first-person consequence to it. The distinction is conceptually necessary inside the model even though an external operational measure of that inward presence remains an open scientific problem.",
    ),
    "DOT calls that hypothesized first self-preserving loop proto-awareness and the developed organism that emerged from it Big C. The term is descriptive, not a claim that persistence alone is conscious.": (
        "DOT calls that hypothesized first self-preserving loop *proto-awareness* and the developed organism that emerged from it **Big C**. The term is descriptive, not a claim that persistence alone is conscious.",
        "DOT locates *proto-awareness* at the next threshold: consequential difference becomes present to the continuing loop itself and is retained as a basis for response. Bare persistence is not enough. The developed self-preserving, experiencing process that emerges from this recursion is **Big C**.",
    ),
    "In RF₀, physics studies these regularities through concepts such as causal structure, symmetry, conservation, coupling, decay, space, time, and statistical law. DOT does not replace those models. It groups the stable constraints they describe under the term world invariants.": (
        "In RF₀, physics studies these regularities through concepts such as causal structure, symmetry, conservation, coupling, decay, space, time, and statistical law. DOT does not replace those models. It groups the stable constraints they describe under the term **world invariants**.",
        "In RF₀, physics derives and tests formal descriptions of these regularities through causal structure, symmetry, conservation, coupling, decay, space, time, and statistical law. DOT groups the stable constraints they describe under **world invariants** and requires them to arise from the Frame’s state-space and transition structure. The physical sciences are therefore contained as exact downstream accounts of generated regularity.",
    ),
}

MARKDOWN_POST_EDITS: dict[str, tuple[tuple[str, str], ...]] = {
    "architecture-of-continuity.md": (
        (
            "> **Claim boundary**\n>\n> Physics formalizes the runtime generated by RF₀.\n>\n> DOT must derive the runtime from its source architecture.",
            "> **Derivation boundary**\n>\n> Physics formalizes the runtime generated by RF₀.\n>\n> DOT must derive the runtime from its source architecture.",
        ),
    ),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=pathlib.Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=pathlib.Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--web-source", type=pathlib.Path, default=DEFAULT_WEB_SOURCE
    )
    parser.add_argument(
        "--web-output", type=pathlib.Path, default=DEFAULT_WEB_OUTPUT
    )
    parser.add_argument("--release-date", default=DEFAULT_RELEASE_DATE)
    parser.add_argument(
        "--force",
        action="store_true",
        help="Replace an existing v3 candidate after all exact-source checks pass.",
    )
    return parser.parse_args()


def markdown_word_count(markdown: str) -> int:
    without_urls = re.sub(r"https?://\S+", "", markdown)
    without_math = re.sub(r"\$\$.*?\$\$", "", without_urls, flags=re.DOTALL)
    return len(re.findall(r"\b[\w’'-]+\b", without_math))


def build_web_release(
    source: pathlib.Path,
    output: pathlib.Path,
    manuscript: pathlib.Path,
    release_date: str,
    force: bool,
) -> None:
    if not (source / "manifest.json").is_file():
        raise SystemExit(f"Book web release not found: {source}")
    if output.exists():
        if not force:
            raise SystemExit(
                f"Refusing to replace existing web release without --force: {output}"
            )
        shutil.rmtree(output)

    source_sections = sorted((source / "sections").glob("*.md"))
    contents = {path: path.read_text(encoding="utf-8") for path in source_sections}
    replacements: dict[pathlib.Path, list[tuple[str, str]]] = {}
    for edit in EDITS:
        old, new = MARKDOWN_EDITS.get(edit.old, (edit.old, edit.new))
        matches = [path for path, content in contents.items() if old in content]
        occurrences = sum(contents[path].count(old) for path in matches)
        if occurrences != 1:
            raise RuntimeError(
                f"Expected one v2 web passage, found {occurrences} "
                f"for {edit.section}: {old[:140]}"
            )
        replacements.setdefault(matches[0], []).append((old, new))

    shutil.copytree(source, output)
    for source_path, path_replacements in replacements.items():
        content = contents[source_path]
        for old, new in path_replacements:
            content = content.replace(old, new, 1)
        for old, new in MARKDOWN_POST_EDITS.get(source_path.name, ()):
            if content.count(old) != 1:
                raise RuntimeError(
                    f"Expected one v3 presentation passage in {source_path.name}: "
                    f"{old[:120]}"
                )
            content = content.replace(old, new, 1)
        (output / "sections" / source_path.name).write_text(content, encoding="utf-8")

    manifest_path = output / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["generated_at"] = f"{release_date}T00:00:00Z"
    manifest["source"] = {
        "format": "docx",
        "name": manuscript.name,
        "sha256": hashlib.sha256(manuscript.read_bytes()).hexdigest(),
    }
    manifest["release"].update(
        {
            "id": "dot-book-one-v3",
            "version": 3,
            "status": "published",
            "published_at": release_date,
            "updated_at": release_date,
        }
    )
    total_words = 0
    for section in manifest["sections"]:
        content = (output / section["content_path"]).read_text(encoding="utf-8")
        words = markdown_word_count(content)
        section["word_count"] = words
        section["reading_time_minutes"] = max(1, round(words / 220))
        total_words += words
    manifest["extent"]["words"] = total_words
    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    args = parse_args()
    source = args.input.resolve()
    output = args.output.resolve()
    web_source = args.web_source.resolve()
    web_output = args.web_output.resolve()
    if not source.is_file():
        raise SystemExit(f"Book manuscript not found: {source}")
    if output.exists() and not args.force:
        raise SystemExit(f"Refusing to replace existing manuscript without --force: {output}")

    source_bytes = source.read_bytes()
    with zipfile.ZipFile(source) as archive:
        archive_members = archive.infolist()
        parts = {name: archive.read(name) for name in archive.namelist()}

    document = minidom.parseString(parts["word/document.xml"])
    paragraphs_by_text: dict[str, list] = {}
    for paragraph in document.getElementsByTagName("w:p"):
        value = paragraph_text(paragraph)
        if value:
            paragraphs_by_text.setdefault(value, []).append(paragraph)

    seen: set[str] = set()
    for edit in EDITS:
        if edit.old in seen:
            raise RuntimeError(f"Duplicate source paragraph: {edit.old[:100]}")
        seen.add(edit.old)
        matches = paragraphs_by_text.get(edit.old, [])
        if len(matches) != 1:
            raise RuntimeError(
                f"Expected exactly one source paragraph, found {len(matches)} "
                f"for {edit.section}: {edit.old[:140]}"
            )
        if matches[0].getElementsByTagName("w:hyperlink"):
            raise RuntimeError(f"Refusing to flatten linked paragraph: {edit.old[:100]}")
        replace_paragraph_text(matches[0], edit.new)

    timestamp = f"{args.release_date}T00:00:00Z"
    core = minidom.parseString(parts["docProps/core.xml"])
    modified = core.getElementsByTagName("dcterms:modified")
    if modified:
        while modified[0].firstChild is not None:
            modified[0].removeChild(modified[0].firstChild)
        modified[0].appendChild(core.createTextNode(timestamp))

    parts["word/document.xml"] = document.toxml(encoding="UTF-8")
    parts["docProps/core.xml"] = core.toxml(encoding="UTF-8")
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for member in archive_members:
            archive.writestr(member, parts[member.filename])

    build_web_release(
        source=web_source,
        output=web_output,
        manuscript=output,
        release_date=args.release_date,
        force=args.force,
    )

    print("Built Book One v3 foundational revision:")
    print(f"  Source: {source}")
    print(f"  Source SHA-256: {hashlib.sha256(source_bytes).hexdigest()}")
    print(f"  Output: {output}")
    print(f"  Output SHA-256: {hashlib.sha256(output.read_bytes()).hexdigest()}")
    print(f"  Exact paragraph edits: {len(EDITS)}")
    print(f"  Web release: {web_output}")


if __name__ == "__main__":
    main()
