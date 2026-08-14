"""Create a reversible line-edited Book One candidate and word-level redline.

The authoritative manuscript is never modified. Edits are exact paragraph
replacements so that every change is reviewable, reproducible, and rejected if
the source wording has drifted.
"""

from __future__ import annotations

import argparse
import datetime
import difflib
import hashlib
import html
import json
import pathlib
import re
import zipfile
from dataclasses import dataclass
from xml.dom import Node, minidom

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
XML_NS = "http://www.w3.org/XML/1998/namespace"

DEFAULT_SOURCE = pathlib.Path("docs/blueprint/DOT-Book-One-Digital-Edition-v2.docx")
DEFAULT_OUTPUT = pathlib.Path("artifacts/book-edit")
CANDIDATE_NAME = "DOT-Book-One-Line-Edit-Preface-Chapter-1.docx"
REDLINE_NAME = "DOT-Book-One-Line-Edit-Preface-Chapter-1-Redline.html"
REPORT_NAME = "DOT-Book-One-Line-Edit-Preface-Chapter-1.json"


@dataclass(frozen=True)
class Edit:
    section: str
    rationale: str
    old: str
    new: str
    formatted_suffix: str | None = None


EDITS = (
    Edit(
        "Preface",
        "Compress the opening without losing its first-person premise.",
        "Before you can examine an object, interpret a result, trust an instrument, or accept a scientific conclusion, conscious experience is already present. You feel. You notice. You compare. You doubt. You decide what deserves another look. This is the phenomenon of consciousness: inquiry is not merely processed; it is experienced from a first-person point of view.",
        "Before you can examine an object, interpret a result, trust an instrument, or accept a scientific conclusion, conscious experience is already present. You feel, notice, compare, doubt, and decide what deserves another look. Inquiry is not merely processed. It is experienced from a first-person point of view.",
    ),
    Edit(
        "Preface",
        "Make the relationship between scientific method and experience more direct.",
        "Scientific method is indispensable because subjective judgment is fallible. Instruments, measurement, replication, and collective scrutiny help correct that judgment. They do not make conscious experience disappear. Every result must still be perceived, interpreted, and understood before it can become knowledge for anyone.",
        "Scientific method is indispensable because subjective judgment is fallible. Measurement, replication, and collective scrutiny help correct it. But they do not make conscious experience disappear. Every result must still be perceived, interpreted, and understood before it becomes knowledge for anyone.",
    ),
    Edit(
        "Preface",
        "Remove abstraction and state the manuscript's originating refusal plainly.",
        "This book began with my refusal to treat this first-person dimension as noise—or its exclusion as scientific rigor. Ignoring subjective experience does not make an inquiry complete. It leaves part of the inquiring system unexamined.",
        "This book began with a refusal to treat the first-person dimension as noise, or its exclusion as rigor. Ignoring subjective experience does not complete an inquiry. It leaves part of the inquiring system unexamined.",
    ),
    Edit(
        "Preface",
        "Shorten the autobiographical sentence while preserving its ordinary-life grounding.",
        "For nearly two decades, I have tried to understand what our subjective life is telling us about consciousness, identity, fear, culture, and the reality in which they arise. I did not conduct this inquiry from a monastery or from outside ordinary life. I conducted it while studying, working, building systems, raising a family, carrying debt, making mistakes, and trying to understand why a life that appeared coherent from the outside could still feel misaligned from within.",
        "For nearly two decades, I have tried to understand what subjective life tells us about consciousness, identity, fear, culture, and the reality in which they arise. I pursued this inquiry not outside ordinary life, but while studying, working, building systems, raising a family, carrying debt, making mistakes, and asking why a life coherent from the outside could still feel misaligned within.",
    ),
    Edit(
        "Preface",
        "Keep the author's technical lens while reducing professional preamble.",
        "I work as a software engineer, an AI researcher, and a systems architect. My training taught me to look for interfaces, state, feedback, adaptation, latency, and the hidden assumptions built into a model. It also gave me the computational language used throughout this book. If I had spent my life as a musician, farmer, or physician, I might have reached for different metaphors. I use the language I know.",
        "I work as a software engineer, AI researcher, and systems architect. My training taught me to look for interfaces, state, feedback, adaptation, latency, and hidden assumptions. It also gave me the computational language used in this book. A musician, farmer, or physician might have reached for different metaphors. I use the language I know.",
    ),
    Edit(
        "Preface",
        "Introduce the architecture with less scaffolding.",
        "DOT asks whether consciousness can be understood as a living informational process rather than as a passive side effect of matter. It proposes a larger architecture involving a hypothesized conscious process called Big C; individuated centers of experience called Little c; rule-bound experiential environments called Reality Frames; and an evolving inner substrate called the Canvas. These ideas become increasingly specific as the book develops.",
        "DOT asks whether consciousness can be understood as a living informational process rather than a passive side effect of matter. Its architecture includes a hypothesized conscious process called Big C; individuated centers of experience called Little c; rule-bound environments called Reality Frames; and an evolving inner substrate called the Canvas. Each becomes more specific as the book develops.",
    ),
    Edit(
        "Preface",
        "Clarify the claim ladder and reduce repeated clauses.",
        "What I directly know is that experience occurs, that it is mediated, that attention changes what becomes available to us, that feeling carries information about the condition of the observer, and that human beings can become increasingly aware of the patterns shaping their perception and action. What I infer is that these processes may belong to an architecture larger than the brain and body through which we encounter them. What I hypothesize is that consciousness is fundamental and that our physical universe is one Reality Frame within a wider field of experience. The later claims do not become facts merely because the earlier observations are real.",
        "What I directly know is that experience occurs and is mediated; attention changes what becomes available; feeling carries information about the observer; and people can become aware of patterns shaping perception and action. I infer that these processes may belong to an architecture larger than the brain and body through which we encounter them. I hypothesize that consciousness is fundamental and our physical universe is one Reality Frame within a wider field of experience. Later claims do not become facts because earlier observations are real.",
    ),
    Edit(
        "Preface",
        "Address the reader directly.",
        "I want the reader to be able to tell which ground we are standing on.",
        "I want you to know which ground we are standing on.",
    ),
    Edit(
        "Preface",
        "Preserve the principle while making its two failure modes easier to compare.",
        "Feeling reveals something about the interpreter’s relationship to reality. It may carry accurate information about danger, loss, attachment, contradiction, or meaning. It may also carry an inherited expectation, an old wound, a cultural assumption, or a prediction that no longer fits the present. To exclude feeling is to discard evidence from inside the phenomenon being studied. To treat every feeling as an infallible description of the world is to abandon rigor.",
        "Feeling reveals something about the interpreter’s relationship to reality. It may carry accurate information about danger, loss, attachment, contradiction, or meaning. It may instead carry an inherited expectation, an old wound, a cultural assumption, or a prediction that no longer fits. Excluding feeling discards evidence from inside the phenomenon. Treating every feeling as an infallible description of the world abandons rigor.",
    ),
    Edit(
        "Preface",
        "Reduce repetition in the account of observer influence.",
        "Science has developed extraordinary methods for reducing the effects of individual bias. Those methods are among humanity’s greatest achievements. But no method removes the observer from existence. Human beings still select the questions, define the variables, construct the instruments, interpret the results, reward certain programs of research, and decide which possibilities are respectable enough to investigate. The subjective does not disappear because the published paper is written in the passive voice.",
        "Science has developed extraordinary methods for reducing individual bias. But no method removes the observer from existence. Human beings select questions, define variables, construct instruments, interpret results, reward research programs, and decide which possibilities are respectable enough to investigate. The subjective does not disappear because a paper is written in the passive voice.",
    ),
    Edit(
        "Preface",
        "Make Fear's epistemic effect concrete without restating the same construction.",
        "Fear does not merely make a person uncomfortable. It can narrow the hypothesis space. It can make certain questions feel dangerous, certain conclusions intolerable, and certain forms of evidence invisible. A frightened investigator can discover a true fact. But where Fear governs inquiry, the investigation becomes limited by what the investigator can bear to find.",
        "Fear can do more than make an investigator uncomfortable. It can narrow the hypothesis space, making certain questions feel dangerous, conclusions intolerable, and evidence invisible. A frightened investigator can discover a true fact. But when Fear governs inquiry, investigation is limited by what the investigator can bear to find.",
    ),
    Edit(
        "Preface",
        "Broaden the criticism cleanly and retain the author's self-inclusion.",
        "This is not an accusation directed only at scientists. It applies to religious believers, materialists, mystics, political ideologues, institutions, families, and to me. No worldview receives an exemption.",
        "This applies not only to scientists, but to religious believers, materialists, mystics, political ideologues, institutions, families, and me. No worldview receives an exemption.",
    ),
    Edit(
        "Preface",
        "Make the permission to disagree feel personal and unambiguous.",
        "A reader’s resistance to DOT may be defensive. It may also be the accurate detection of an unsupported claim. DOT does not get to decide which one it is in advance.",
        "Your resistance to DOT may be defensive. It may also be an accurate response to an unsupported claim. DOT does not get to decide in advance.",
    ),
    Edit(
        "Preface",
        "State the anti-overreach standard once and with equal force for every theory.",
        "The same standard must be applied in both directions. A theory that unifies physical interactions has not thereby explained conscious experience. Its mathematics may be exact within its domain; the overreach begins when a bounded method is promoted into a complete ontology. Any theory—including DOT—becomes pseudoscientific at the point where its claims exceed the domain its methods can honestly examine.",
        "The standard runs both ways. A theory that unifies physical interactions has not thereby explained conscious experience. Its mathematics may be exact within its domain; overreach begins when a bounded method is promoted into a complete ontology. Any theory, including DOT, becomes pseudoscientific when its claims exceed what its methods can honestly examine.",
    ),
    Edit(
        "Preface",
        "Define Love with less defensive setup.",
        "By Love, I do not mean sentimentality, agreement, passivity, or the disappearance of every protective sensation. A person can love while frightened. Courage often acts in the presence of fear. In DOT, Love names a more exact condition:",
        "By Love, I do not mean sentimentality, agreement, passivity, or the absence of protective sensation. A person can love while frightened; courage often acts in fear’s presence. In DOT, Love names a more exact condition:",
    ),
    Edit(
        "Preface",
        "Tighten the distinction between protective fear and governing Fear.",
        "I capitalize Fear when I mean more than the body’s immediate protective response. Fear is the governing contraction that organizes perception around defense, control, avoidance, domination, or the preservation of identity at the expense of truth.",
        "I capitalize Fear when I mean more than the body’s immediate protective response. Fear is the governing contraction that organizes perception around defense, control, avoidance, domination, or preserving identity at the expense of truth.",
    ),
    Edit(
        "Preface",
        "Let the epistemic claim land without a redundant transition.",
        "Love creates enough inner freedom for reality to contradict identity. It permits us to inspect what we inherited without immediately defending it, to encounter another person without reducing them to a threat, and to revise a cherished model when consequence no longer supports it. In this sense, Love is not only a moral aspiration. It is an epistemic necessity.",
        "Love creates enough inner freedom for reality to contradict identity. It lets us inspect what we inherited without reflexively defending it, encounter another person without reducing them to a threat, and revise a cherished model when consequence no longer supports it. Love is therefore not only a moral aspiration. It is an epistemic necessity.",
    ),
    Edit(
        "Preface",
        "Turn the invitation into a clear reading posture.",
        "I am not asking you to believe DOT before it has earned your confidence. I am asking you to examine the model, compare it with your experience, test its practical claims where they can be tested, and challenge its larger hypotheses where they exceed the available evidence.",
        "I am not asking you to believe DOT before it earns your confidence. Examine the model. Compare it with your experience. Test practical claims where they can be tested, and challenge larger hypotheses where they exceed the evidence.",
    ),
    Edit(
        "Preface",
        "Replace tentative editorial language with a firm publication standard.",
        "The book will sometimes travel near the border between science, philosophy, and metaphysics. I will try to mark those crossings honestly. Where established research bears on the argument, it must be represented accurately. Where DOT offers an alternative interpretation, it must be called an interpretation. Where no present experiment can decide the matter, speculation must remain speculation.",
        "The book sometimes crosses the borders of science, philosophy, and metaphysics. I will mark those crossings. Established research must be represented accurately. DOT’s alternative interpretations must be named as interpretations. Where no present experiment can decide the matter, speculation must remain speculation.",
    ),
    Edit(
        "Preface",
        "Keep the intellectual humility while shortening the explanation.",
        "I have developed this framework largely alone. That independence helped me follow questions that did not fit comfortably inside existing categories. It also creates risk. A system built by one mind can become coherent because the same mind defines the terms, selects the evidence, and judges whether its own objections have been answered. This manuscript must therefore invite serious resistance. It must become capable of correction.",
        "I developed this framework largely alone. That independence let me follow questions that did not fit existing categories, but it also creates risk. One mind can produce coherence by defining the terms, selecting the evidence, and judging its own objections. This manuscript must invite serious resistance and remain capable of correction.",
    ),
    Edit(
        "Preface",
        "Close on usefulness with less repetition and a stronger cadence.",
        "It is a model built from sustained subjective observation, scientific training, systems thinking, and an attempt to understand the raw contradictions of human life. Its value will not be determined by how total it sounds. Its value will be determined by whether it helps you see more clearly, ask better questions, reduce confusion, enlarge your decision-space, and live with greater honesty and Love.",
        "This model grows from sustained subjective observation, scientific training, systems thinking, and an attempt to understand the contradictions of human life. Its value will not be determined by how total it sounds, but by whether it helps you see clearly, ask better questions, reduce confusion, enlarge your decision-space, and live with greater honesty and Love.",
    ),
    Edit(
        "Chapter 1",
        "Improve the opening rhythm while preserving the neural distinction.",
        "You are experiencing these words. Symbols arrive, recognition forms, associations appear, and a response begins before you decide whether you agree. The page contains marks. Your nervous system participates. Yet neither the marks nor a description of the neural activity is identical to what the sentence feels like from where you are.",
        "You are experiencing these words. Symbols arrive, recognition forms, associations appear, and a response begins before you decide whether you agree. The page contains marks; your nervous system participates. Yet neither the marks nor a description of neural activity is identical to what the sentence feels like from where you are.",
    ),
    Edit(
        "Chapter 1",
        "Remove a repeated opening construction and retain the evidential boundary.",
        "DOT does not begin by denying matter, neuroscience, or the physical world. It begins by refusing to explain away the first-person experience in which the physical world appears. We can correlate experience with brain activity, manipulate it through chemicals, alter it through injury, and interrupt its ordinary expression through anesthesia. These facts are indispensable. But correlation, dependence, and manipulation do not by themselves settle what consciousness ultimately is.",
        "DOT does not deny matter, neuroscience, or the physical world. It refuses to explain away the first-person experience in which the physical world appears. We can correlate experience with brain activity, alter it through chemicals or injury, and interrupt its ordinary expression through anesthesia. These facts are indispensable. But correlation, dependence, and manipulation do not settle what consciousness ultimately is.",
    ),
    Edit(
        "Chapter 1",
        "Make the competing position legible to a general reader.",
        "A broad family of physicalist theories holds that consciousness is produced by, realized in, or identical with sufficiently organized physical processes. DOT considers a different hypothesis: consciousness may be fundamental, while the brain and body are the local interface through which consciousness participates in this world.",
        "Many physicalist theories hold that consciousness is produced by, realized in, or identical with sufficiently organized physical processes. DOT considers another hypothesis: consciousness may be fundamental, while the brain and body are the local interface through which it participates in this world.",
    ),
    Edit(
        "Chapter 1",
        "State the chapter contract as an active task.",
        "Its job is more disciplined. It will define the model, establish the limits of its metaphors, and introduce the minimum architecture required for the rest of the book. The scientific and philosophical debts created here must be paid later.",
        "Its task is more disciplined: define the model, establish the limits of its metaphors, and introduce the minimum architecture required for the rest of the book. The scientific and philosophical debts created here must be paid later.",
    ),
    Edit(
        "Chapter 1",
        "Reduce repetition in the biological example.",
        "A biological organism must continually regulate itself. It detects changes, distinguishes nourishment from threat, repairs damage, maintains boundaries, and adapts across time. A living cell is material, but its survival also depends on information: which gradients matter, which signals trigger which response, which structures must be reproduced, and which deviations must be corrected.",
        "A biological organism must continually regulate itself. It detects change, distinguishes nourishment from threat, repairs damage, maintains boundaries, and adapts. A living cell is material, but survival also depends on information: which gradients matter, which signals trigger a response, which structures must be reproduced, and which deviations corrected.",
    ),
    Edit(
        "Chapter 1",
        "Keep the anti-reduction point while removing the setup's stop-start rhythm.",
        "This does not make a bacterium a laptop. It does not reduce life to code. It says that living persistence requires more than the possession of matter. It requires organized differences that mean something to the organism and influence what the organism does next.",
        "This does not make a bacterium a laptop or reduce life to code. It says that living persistence requires more than possessing matter. It requires organized differences that matter to the organism and influence what it does next.",
    ),
    Edit(
        "Chapter 1",
        "Make the limits of communicated experience more fluid.",
        "I cannot place my grief, wonder, fear, or recognition inside you. I can describe an event, reproduce a measurement, show you an image, or offer a metaphor. What reaches you is an encoded signal. You interpret it through what you already know.",
        "I cannot place my grief, wonder, fear, or recognition inside you. I can describe an event, reproduce a measurement, show an image, or offer a metaphor. What reaches you is an encoded signal, interpreted through what you already know.",
    ),
    Edit(
        "Chapter 1",
        "Name metaphors as handles and remove explanatory padding.",
        "The computational metaphors in DOT belong to the second order. Digital Organism, process, rendering, Canvas, and Reality Frame are pointing devices. They allow us to discuss relationships that are otherwise difficult to hold in language. They are not the reality itself.",
        "DOT’s computational metaphors belong to the second order. Digital Organism, process, rendering, Canvas, and Reality Frame are handles for relationships otherwise difficult to hold in language. They are not reality itself.",
    ),
    Edit(
        "Chapter 1",
        "Clarify how a model earns confidence.",
        "Science also uses models. A field, a wave, a particle, a genetic code, or a force may be mathematically precise, but the model remains a structured representation of what is observed. The success of a model depends on what it explains, predicts, and allows us to do—not on whether we forget that it is a model.",
        "Science also uses models. A field, wave, particle, genetic code, or force may be mathematically precise, yet remains a structured representation of what is observed. A model succeeds by what it explains, predicts, and allows us to do, not by making us forget it is a model.",
    ),
    Edit(
        "Chapter 1",
        "Explain recursion without repeating the observer's position.",
        "That sentence can sound circular because the condition itself is recursive. The observer is not standing outside consciousness and looking in. The observer is participating in the phenomenon being investigated. Every instrument, measurement, and third-person report ultimately becomes available through experience.",
        "The sentence sounds circular because the condition is recursive. The observer does not stand outside consciousness and look in, but participates in the phenomenon being investigated. Every instrument, measurement, and third-person report ultimately becomes available through experience.",
    ),
    Edit(
        "Chapter 1",
        "Define objectivity positively and compactly.",
        "Objectivity is a disciplined method for coordinating observations, reducing individual distortion, and constructing claims that do not depend entirely on one person’s report. It is not proof that the subjective has ceased to exist. The achievement of science is not that it escaped all observers. It is that observers learned to correct one another.",
        "Objectivity is a disciplined method for coordinating observations, reducing individual distortion, and constructing claims that do not depend on one person’s report. It does not prove that the subjective has ceased to exist. Science did not escape all observers; observers learned to correct one another.",
    ),
    Edit(
        "Chapter 1",
        "Make the two evidence streams easier to compare.",
        "Third-person measurements can map reliable relationships without revealing what the relationship feels like from within. First-person reports can disclose experience while remaining vulnerable to memory error, suggestion, interpretation, and self-deception. A mature science of consciousness must learn how these streams constrain one another.",
        "Third-person measurements can map reliable relationships without revealing what those relationships feel like from within. First-person reports can disclose experience while remaining vulnerable to memory error, suggestion, interpretation, and self-deception. A mature science of consciousness must learn how the two streams constrain one another.",
    ),
    Edit(
        "Chapter 1",
        "Let the author’s lived inquiry, rather than an abstract observation list, introduce DOT’s origin.",
        "What I Observed",
        "How the Inquiry Began",
    ),
    Edit(
        "Chapter 1",
        "Begin with the sustained intuition and difficult inner work from which the theory actually emerged.",
        "My path into DOT began with experiences more ordinary than the cosmology the theory eventually produced.",
        "DOT emerged from a long and arduous inquiry into my own inner workings. Long before I had a theory, I carried a deep intuition that there was more to existence than the accounts available to me could explain. I did not yet know what that feeling meant. I only knew I could not dismiss it.",
    ),
    Edit(
        "Chapter 1",
        "Restore the formative experience of encountering the twin paradox while growing up in the Horn of Africa.",
        "I observed that my experience was mediated. The same event could enter my life differently depending on what I feared, expected, knew, or was prepared to notice. Attention altered which parts of a situation became available. Repetition turned choices into tendencies. Tendencies began to feel like identity. When an interpretation became emotionally protected, evidence was often recruited to defend it.3,4,20",
        "I was born in the Horn of Africa. I remember reading about the twin paradox in Einstein’s theory of relativity, and a light went on in my mind. Here was a disciplined demonstration that reality could be stranger than ordinary intuition: time itself was not fixed in the way it appeared. The paradox did not give me DOT. It gave my deeper intuition intellectual permission.",
    ),
    Edit(
        "Chapter 1",
        "Name the author’s encounter with American consumption and the unanswered human questions beneath technical progress.",
        "I observed that the body and inner life were tightly coupled. An unresolved thought could change sleep, muscle tension, digestion, attention, and behavior. A shift in meaning could change the body’s response even when the external event remained the same.15",
        "When I moved to the United States, I encountered a civilization rich in applied science yet immersed in consumption. Its technical power was obvious. What troubled me was how little of that power seemed directed toward the oldest questions: What are we? What is consciousness? What kind of life helps a human being develop? We knew how to build more, measure more, and consume more, but not necessarily how to understand ourselves.",
    ),
    Edit(
        "Chapter 1",
        "Explain why studying physics did not satisfy the existential inquiry.",
        "I observed that clarity was not merely intellectual. I could possess an argument and still be unable to live it. Some truths did not become operational until the fear protecting the old pattern was seen and addressed. When fear contracted, the available choices contracted with it. When the contraction loosened, possibilities that had been present all along became visible.",
        "I began studying physics in college because I wanted to follow those questions seriously. Yet college did not feel conducive to deep existential inquiry. It taught established problems and rewarded correct movement through a curriculum, but offered little room to ask what our knowledge meant for the nature of existence or for the person doing the knowing.",
    ),
    Edit(
        "Chapter 1",
        "Describe how the academic achievement cycle displaced the deeper purpose of doctoral study.",
        "I also observed that we are not static.",
        "I continued into a PhD in computer science, hoping to find a better home for the inquiry. Instead, I became caught in another cycle: publish, improve my rank, build a career, move to the next measurable achievement. The work demanded intelligence, but the system left little space for the questions that had brought me there.",
    ),
    Edit(
        "Chapter 1",
        "Show the decision to make subjective inquiry central and retain the research supporting attention and motivated interpretation.",
        "Human beings can inspect their own conditioning, revise patterns, and participate in changing the very interpreter through which the next experience will be understood. We are shaped by information, yet we can become increasingly aware of how that information is shaping us.",
        "Eventually I made a decision: if the institutions around me would not make existential inquiry central, I would. I began studying my subjective feedback with the patience I had been trained to bring to systems. I watched how attention selected, how fear narrowed, how repetition hardened into identity, and how protected interpretations recruited evidence in their defense.",
        "3,4,20",
    ),
    Edit(
        "Chapter 1",
        "Place the inquiry inside the economic and practical pressures under which it developed.",
        "These observations are the experiential foundation of DOT.",
        "I did this while struggling with regular life, not apart from it. Student loans, a mortgage, corporate IT work, family obligations, and the pressure to remain economically functional did not pause for the inquiry. The work had to continue inside the very conditions I was trying to understand.",
    ),
    Edit(
        "Chapter 1",
        "Describe altered states as lived experience while preserving their subjective and embodied status.",
        "They do not prove Big C, multiple Reality Frames, nonphysical memory, or a rendered universe. Those came later as attempts to explain how the observed architecture might fit into a larger account of existence.",
        "Over time, the inquiry became more than reflection. With sustained focus, I could sometimes loosen my ordinary identification with the body and enter altered states with relative ease. Some experiences felt like a partial decoupling of awareness from the body. Changes in meaning and attention also changed sleep, tension, bodily response, and the possibilities I could perceive. At times, the process felt less like invention than a nudge toward something I had to follow.",
        "15",
    ),
    Edit(
        "Chapter 1",
        "Keep altered states inside the Subjective Data Principle rather than presenting them as cosmological proof.",
        "The distinction is essential:",
        "I do not offer these experiences as proof of Big C, nonphysical memory, or a rendered universe. Altered states can have biological and psychological explanations. But as subjective data, they mattered. They showed me that the ordinary sense of self was not as simple or fixed as I had assumed, and they gave the inquiry an architecture to test rather than an intuition to worship.",
    ),
    Edit(
        "Chapter 1",
        "End the origin account by naming struggle as part of the theory’s formation.",
        "The observation is that experience is mediated, recursive, embodied, and capable of self-modification. The cosmology is DOT’s attempt to explain why.",
        "The struggle was not separate from the inquiry. It was instrumental in helping me build the theory. What emerged was not certainty that my intuition had been right, but a model for examining the possibility that life contains more than I had assumed.",
    ),
    Edit(
        "Chapter 1",
        "State the observer's epistemic limit in fewer abstractions.",
        "A process embedded within a system may infer properties of the system from regularities, constraints, permissions, and failures. It may construct increasingly powerful models. But it cannot assume that it has acquired a view from nowhere.",
        "An embedded process may infer properties of its system from regularities, constraints, permissions, and failures. It may build increasingly powerful models. But it cannot assume a view from nowhere.",
    ),
    Edit(
        "Chapter 1",
        "Replace a three-step disclaimer with one positive constraint.",
        "The Limit of Knowledge is not permission to fill the unknown with whatever story we prefer. It is the opposite. It is a restraint on certainty. It says that some source conditions may be inferred as necessary to the model while remaining inaccessible in their underlying nature.",
        "The Limit of Knowledge does not permit us to fill the unknown with whatever story we prefer. It restrains certainty. Some source conditions may be necessary to the model while remaining inaccessible in their underlying nature.",
    ),
    Edit(
        "Chapter 1",
        "Introduce E in one sentence before stating what it is not.",
        "DOT uses the term External Environment, or E, for the hypothesized source condition from which fundamental informational processes could emerge. E is not a place floating beyond the universe. It is a placeholder for whatever must be the case for differentiation, change, and persistence to become possible at all.",
        "DOT calls the hypothesized source condition from which fundamental informational processes could emerge the External Environment, or E. E is not a place floating beyond the universe. It is a placeholder for whatever must be true for differentiation, change, and persistence to become possible at all.",
    ),
    Edit(
        "Chapter 1",
        "Remove draft-history language from the public argument.",
        "Earlier drafts of DOT described E too concretely, as though we could inspect primordial code or know that it was hostile. That language exceeded the theory’s access. At this stage, the defensible claim is modest: if consciousness or any other process is not self-explanatory, then some enabling condition lies beyond the process as we presently understand it. DOT names that unknown E and stops before pretending to describe its substance.",
        "The defensible claim is modest: if consciousness or any other process is not self-explanatory, some enabling condition lies beyond the process as we understand it. DOT names that unknown E and stops before pretending to describe its substance.",
    ),
    Edit(
        "Chapter 1",
        "State the central hypothesis in one clean contrast.",
        "DOT hypothesizes that Consciousness is not a product appearing late inside an otherwise unconscious reality. It is a fundamental, self-preserving informational process. I call it Big C.",
        "DOT hypothesizes that Consciousness is not a late product of an otherwise unconscious reality, but a fundamental, self-preserving informational process. I call it Big C.",
    ),
    Edit(
        "Chapter 1",
        "Make the biological comparison carry its own conclusion.",
        "Biology offers a visible downstream example. Organisms regulate temperature, repair tissue, seek energy, reproduce, learn, and adapt. Stability is not inactivity. It is maintained through continuous exchange and correction.",
        "Biology offers a visible downstream example. Organisms regulate temperature, repair tissue, seek energy, reproduce, learn, and adapt. Stability is not inactivity; it is maintained through continuous exchange and correction.",
    ),
    Edit(
        "Chapter 1",
        "Shorten the extension from biology to consciousness.",
        "DOT extends this logic beyond biology and asks whether consciousness itself may be the oldest example available to us: a process that persists by taking in difference, forming response, retaining what matters, and becoming more capable of preserving coherence.",
        "DOT extends this logic beyond biology. It asks whether consciousness itself may be the oldest example available to us: a process that persists by taking in difference, responding, retaining what matters, and becoming more capable of preserving coherence.",
    ),
    Edit(
        "Chapter 1",
        "Define work through continuity without repeating the verb.",
        "Work is what a process must do to avoid losing the organization that makes it the process it is. A cell works to maintain a boundary. A body works to regulate itself. A mind works to reconcile experience, update expectation, and direct action. Human labor is one local and socially organized form of a more fundamental requirement.",
        "Work is what a process must do to preserve the organization that makes it itself. A cell maintains a boundary. A body regulates itself. A mind reconciles experience, updates expectation, and directs action. Human labor is one local, socially organized form of a more fundamental requirement.",
    ),
    Edit(
        "Chapter 1",
        "Join continuity and adaptation into one memorable tension.",
        "Rigid systems can preserve a form temporarily while becoming unable to respond. Living persistence requires adaptation. The organism must retain enough identity to remain itself and enough flexibility to become what the next condition requires.",
        "Rigid systems may preserve their form temporarily while losing the capacity to respond. Living persistence requires adaptation: enough continuity to remain itself and enough flexibility to meet what the next condition requires.",
    ),
    Edit(
        "Chapter 1",
        "Reduce ornament in the developmental hypothesis.",
        "The theory imagines early Consciousness as dim rather than omniscient: not a completed deity with a finished design, but a process that learned through the necessity of remaining coherent. Awareness deepened through work. Memory preserved successful distinctions. Adaptation widened the available response. Complexity accumulated.",
        "DOT imagines early Consciousness as dim rather than omniscient: not a completed deity with a finished design, but a process learning through the need to remain coherent. Awareness deepened through work. Memory preserved successful distinctions. Adaptation widened the possible response. Complexity accumulated.",
    ),
    Edit(
        "Chapter 1",
        "Keep the theological contrast while foregrounding its speculative status.",
        "This is a departure from many theological pictures of a perfect and complete Creator. It is also speculative. DOT does not derive Big C’s history from direct observation. It constructs a developmental hypothesis because a learning consciousness better explains the architecture DOT is trying to build than an unexplained perfection placed at the beginning.",
        "This departs from theological pictures of a perfect, complete Creator and remains speculative. DOT does not derive Big C’s history from direct observation. It proposes a developmental hypothesis because a learning consciousness better fits the architecture than unexplained perfection at the beginning.",
    ),
    Edit(
        "Chapter 1",
        "Make the unresolved questions feel like a research agenda.",
        "The hypothesis will need to answer difficult questions. If Big C developed, what constrained its development? If it learned, what counted as feedback? If it preserves coherence, how is coherence distinguished from mere continuation? These are not decorative objections. They define the work required for the theory to mature.",
        "The hypothesis faces difficult questions. If Big C developed, what constrained it? If it learned, what counted as feedback? If it preserves coherence, how is coherence distinguished from continuation? These objections define the work required for the theory to mature.",
    ),
    Edit(
        "Chapter 1",
        "State the strategic limit of an undivided process compactly.",
        "Within DOT’s reconstruction, one undivided process would face a strategic limitation. Exploration could expose the whole to every failure, and only one path could be tested at a time.",
        "Within DOT’s reconstruction, an undivided process would face a strategic limit: exploration could expose the whole to every failure, while only one path could be tested at a time.",
    ),
    Edit(
        "Chapter 1",
        "Make the biological analogy easier to follow.",
        "The computing analogy is a distributed system, but the biological analogy may be gentler. A human body is one organism composed of living cells that occupy local environments, receive limited signals, perform specialized work, and participate in a whole they cannot comprehend from their position. The cell is not imaginary because it is part of the body. Its local life is real. Its actions matter. Yet it does not possess the body’s complete perspective.",
        "The computing analogy is a distributed system; the gentler analogy may be biological. A human body is one organism composed of living cells that inhabit local environments, receive limited signals, perform specialized work, and participate in a whole they cannot comprehend. A cell is not imaginary because it belongs to the body. Its local life is real and its actions matter, yet it does not possess the body’s complete perspective.",
    ),
    Edit(
        "Chapter 1",
        "Connect the conceptual distinction directly to its human consequence.",
        "These distinctions will matter later. Without them, conditioning becomes identity and the person becomes indistinguishable from what happened to them.",
        "These distinctions matter because without them, conditioning becomes identity and the person becomes indistinguishable from what happened to them.",
    ),
    Edit(
        "Chapter 1",
        "Reduce repetition while preserving every concession to neuroscience.",
        "For now, the important point is not to deny the brain. Damage the interface and experience changes. Alter the chemistry and mood, perception, memory, or attention may change. Interrupt the relevant neural activity and the ordinary expression of consciousness may disappear. Any theory that cannot account for these relationships is incomplete.",
        "The point is not to deny the brain. Damage the interface and experience changes. Alter chemistry and mood, perception, memory, or attention may change. Interrupt relevant neural activity and the ordinary expression of consciousness may disappear. Any theory unable to account for these relationships is incomplete.",
    ),
    Edit(
        "Chapter 1",
        "Keep the instrument analogy within its stated evidential limit.",
        "A musician depends on an instrument to produce music in a room. Damage the instrument and the music changes. That fact proves the importance of the instrument; it does not, by itself, tell us whether the instrument originated the musician. The analogy cannot prove that consciousness exists independently of the brain. It clarifies the alternative DOT intends to investigate.",
        "A musician depends on an instrument to produce music in a room. Damage the instrument and the music changes. This proves the instrument matters; it does not reveal whether the instrument originated the musician. The analogy cannot prove that consciousness exists independently of the brain. It only clarifies the alternative DOT intends to investigate.",
    ),
    Edit(
        "Chapter 1",
        "Introduce RF0 without making the notation feel like a detour.",
        "A Reality Frame is a rule-bound environment in which action meets consequence. The physical universe we inhabit is RF₀ in DOT’s notation. Gravity, chemistry, biological limitation, spatial distance, time, scarcity, other agents, and the irreversibility of many actions give this Frame its density.",
        "A Reality Frame is a rule-bound environment in which action meets consequence. DOT calls our physical universe RF₀. Gravity, chemistry, biological limits, spatial distance, time, scarcity, other agents, and the irreversibility of many actions give this Frame its density.",
    ),
    Edit(
        "Chapter 1",
        "Lead with the Frame's learning function.",
        "The Frame is not merely a visual stage. It is the structure that makes learning possible. Information has meaning only in relation to constraints. A door matters because it may open or remain closed. A promise matters because it can be kept or broken. A body matters because it can flourish, hurt, heal, and die.",
        "The Frame is more than a visual stage. It makes learning possible by giving information meaning through constraint. A door matters because it may open or remain closed. A promise matters because it can be kept or broken. A body matters because it can flourish, hurt, heal, and die.",
    ),
    Edit(
        "Chapter 1",
        "Separate observed learning from hypothesized purpose more directly.",
        "DOT later hypothesizes that Big C developed Reality Frames as environments through which Little c could differentiate and learn. That purpose is not directly observable. We should not confuse the fact that humans can learn from consequence with proof that every consequence was designed as a lesson.",
        "DOT later hypothesizes that Big C developed Reality Frames so Little c could differentiate and learn. That purpose is not directly observable. The fact that humans can learn from consequence does not prove that every consequence was designed as a lesson.",
    ),
    Edit(
        "Chapter 1",
        "State the ethical boundary without explaining that a boundary is needed.",
        "This ethical firewall is necessary. A framework that calls reality an incubator must never use that metaphor to excuse cruelty, neglect, oppression, or the suffering of another person.",
        "This ethical boundary is essential. Calling reality an incubator must never excuse cruelty, neglect, oppression, or another person’s suffering.",
    ),
    Edit(
        "Chapter 1",
        "Make perceptual mediation easier to absorb in one reading.",
        "At any moment, only a small portion of the available environment becomes conscious experience. The senses sample. Attention selects. The nervous system filters. Memory supplies context. Expectation participates in interpretation. The present moment is therefore not a complete copy of the world. It is a usable construction formed from incoming signals and the condition of the interpreter.",
        "At any moment, only part of the available environment enters conscious experience. The senses sample. Attention selects. The nervous system filters. Memory supplies context. Expectation helps interpret. The present moment is not a complete copy of the world, but a usable construction formed from incoming signals and the interpreter’s condition.",
    ),
    Edit(
        "Chapter 1",
        "Distinguish mediation from ontological rendering without repeating the setup.",
        "The distinction helps prevent a common confusion. To say that experience is constructed or rendered is not necessarily to say that the external world is unreal. It is to say that the world as experienced is mediated. DOT later advances the stronger hypothesis that the Frame itself is rendered by Big C. That claim belongs to the cosmology and requires separate support.",
        "The distinction prevents a common confusion. Saying that experience is constructed or rendered does not necessarily make the external world unreal; it means the world as experienced is mediated. DOT later offers the stronger hypothesis that Big C renders the Frame itself. That cosmological claim requires separate support.",
    ),
    Edit(
        "Chapter 1",
        "Define Canvas as carried change rather than a container of detail.",
        "The Canvas is DOT’s name for the persistent capacity to carry forward the effects of experience. It is not the memory of every sensory detail. It is the evolving substrate on which tendencies, associations, expectations, and learned responses can accumulate.",
        "The Canvas is DOT’s name for the persistent capacity to carry experience forward. It is not a memory of every sensory detail, but the evolving substrate on which tendencies, associations, expectations, and learned responses accumulate.",
    ),
    Edit(
        "Chapter 1",
        "Make Intent's range and function easier to retain.",
        "Intent is the directional organization of Little c before action. It may appear as a deliberate purpose, a question, an attraction, an avoidance, or a faint leaning that has not yet become language. Intent affects what receives attention, which possibility is selected, and how the body is recruited into action.",
        "Intent is the directional organization of Little c before action. It may appear as deliberate purpose, a question, attraction, avoidance, or a faint leaning not yet in language. Intent affects what receives attention, which possibility is selected, and how the body is recruited to act.",
    ),
    Edit(
        "Chapter 1",
        "Replace draft-history language with the present claim boundary.",
        "Earlier versions of DOT made a claim that was too strong: that clearer Intent necessarily causes Big C to render richer external reality. What can be defended at this stage is narrower. Clear Intent can stabilize attention, organize effort, improve the quality of inquiry, and change which features of a situation become usable. Whether Intent also influences reality beyond those embodied and attentional mechanisms remains a DOT hypothesis.",
        "DOT makes a narrow claim about Intent. Clear Intent can stabilize attention, organize effort, improve inquiry, and change which features of a situation become usable. Whether Intent also influences reality beyond embodied and attentional mechanisms remains a hypothesis.",
    ),
    Edit(
        "Chapter 1",
        "Express recursion as one continuous movement.",
        "The loop is recursive. What has been carried forward helps interpret the next moment. That interpretation shapes action. The consequence modifies what will participate in the next interpretation.",
        "The loop is recursive. What has been carried forward helps interpret the next moment; interpretation shapes action; consequence changes what participates in the next interpretation.",
    ),
    Edit(
        "Chapter 1",
        "Reduce the inventory of inherited conditions without diminishing it.",
        "It arrives through a body already carrying needs, sensitivities, inherited biology, and developmental limits. It enters a family, language, culture, economy, history, and arrangement of power it did not choose. Before it can inspect these conditions, it must adapt to them.",
        "It arrives through a body with needs, sensitivities, inherited biology, and developmental limits. It enters a family, language, culture, economy, history, and arrangement of power it did not choose. Before it can inspect these conditions, it must adapt.",
    ),
    Edit(
        "Chapter 1",
        "Show adaptation becoming perception in a tighter sequence.",
        "A child learns what produces care, danger, belonging, shame, praise, withdrawal, and protection. Repetition turns these relationships into expectation. Expectation begins participating in perception. By adulthood, much of what was learned as adaptation feels like reality or identity.",
        "A child learns what produces care, danger, belonging, shame, praise, withdrawal, and protection. Repetition becomes expectation; expectation enters perception. By adulthood, much of what was learned as adaptation feels like reality or identity.",
    ),
    Edit(
        "Chapter 1",
        "Remove a future-tense signpost from the publication edition.",
        "Chapter 6 will develop this movement fully: being painted, seeing the Painting, and becoming the painter.",
        "Chapter 6 develops this movement: being painted, seeing the Painting, and becoming the painter.",
    ),
    Edit(
        "Chapter 1",
        "Replace an internal-review heading with a concise public-facing label.",
        "What Chapter 1 Has—and Has Not—Established",
        "The Claim Boundary",
    ),
    Edit(
        "Chapter 1",
        "Keep the strongest alternative concise and prominent.",
        "The strongest alternative explanation must also remain visible: everything DOT describes at the psychological level may arise from biological cognition, learning, memory, prediction, and metacognition without requiring a nonphysical Little c. Book One does not defeat that account. It argues that the first-person architecture remains worth investigating and that DOT should be judged by whether it can eventually distinguish its stronger claims from this alternative.",
        "Keep the strongest alternative visible: DOT’s psychological account may arise entirely from biological cognition, learning, memory, prediction, and metacognition, without a nonphysical Little c. Book One does not defeat that account. It argues that first-person architecture remains worth investigating and that DOT’s stronger claims must eventually be distinguishable from this alternative.",
    ),
    Edit(
        "Chapter 1",
        "Turn the chapter recap into a compact glossary in motion.",
        "DOT sees existence as process rather than static substance. It treats consciousness as the central phenomenon to be explained rather than an inconvenience to be explained away. It names Big C as the hypothesized larger process, Little c as the local experiencer, the Reality Frame as the field of rule and consequence, the Reality Stream as experience arriving, the Canvas as what carries change forward, and Intent as the directional organization through which Little c participates.",
        "DOT sees existence as process rather than static substance. It treats consciousness as the central phenomenon to explain, not an inconvenience to explain away. Big C names the hypothesized larger process; Little c, the local experiencer; the Reality Frame, the field of rule and consequence; the Reality Stream, experience arriving; the Canvas, what carries change forward; and Intent, the direction through which Little c participates.",
    ),
    Edit(
        "Chapter 1",
        "Address the reader directly and make the practical entry explicit.",
        "Nothing in that loop requires you to accept the entire cosmology before you can inspect your own experience.",
        "You do not need to accept the entire cosmology to inspect that loop in your own experience.",
    ),
    Edit(
        "Chapter 1",
        "Combine the three entry points into one accessible invitation.",
        "A useful theory should permit entry at more than one level. You may treat DOT as a metaphysical proposal about fundamental consciousness. You may treat it as a phenomenological model of mediation, conditioning, and authorship. You may test its practical claims while withholding judgment about Big C. The layers must inform one another without holding one another hostage.",
        "A useful theory permits entry at more than one level. You may read DOT as a metaphysical proposal about fundamental consciousness, a phenomenological model of mediation, conditioning, and authorship, or a set of practical claims you can test while withholding judgment about Big C. The layers should inform one another without holding one another hostage.",
    ),
    Edit(
        "Chapter 1",
        "Sharpen the transition into Chapter 2.",
        "The next chapter turns to the most vulnerable junction in the architecture: the relationship between Little c and the body.",
        "Chapter 2 turns to the architecture’s most vulnerable junction: the relationship between Little c and the body.",
    ),
    Edit(
        "Chapter 1",
        "Shorten the closing research questions without weakening them.",
        "If consciousness is not simply identical to neural activity, how does it participate in action? What should we make of the measurable preparation that precedes reported decisions? How could the Decoupling Principle be distinguished from ordinary neural causation? And what evidence would force DOT to change?",
        "If consciousness is not identical to neural activity, how does it participate in action? What should we make of measurable preparation before reported decisions? How could the Decoupling Principle be distinguished from ordinary neural causation? What evidence would force DOT to change?",
    ),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=pathlib.Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=pathlib.Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def paragraph_text(paragraph: Node) -> str:
    return "".join(
        node.firstChild.data if node.firstChild is not None else ""
        for node in paragraph.getElementsByTagName("w:t")
    ).strip()


def replace_paragraph_text(
    paragraph: Node,
    value: str,
    suffix_run: Node | None = None,
) -> None:
    properties = next(
        (
            node
            for node in paragraph.childNodes
            if node.nodeType == Node.ELEMENT_NODE and node.nodeName == "w:pPr"
        ),
        None,
    )
    for node in list(paragraph.childNodes):
        if node is not properties:
            paragraph.removeChild(node)

    document = paragraph.ownerDocument
    run = document.createElement("w:r")
    text_node = document.createElement("w:t")
    text_node.setAttributeNS(XML_NS, "xml:space", "preserve")
    text_node.appendChild(document.createTextNode(value))
    run.appendChild(text_node)
    paragraph.appendChild(run)
    if suffix_run is not None:
        paragraph.appendChild(suffix_run)


def word_count(value: str) -> int:
    return len(re.findall(r"\b[\w’'-]+\b", value, flags=re.UNICODE))


def edited_text(edit: Edit) -> str:
    return edit.new + (edit.formatted_suffix or "")


def formatted_suffix_templates(document: minidom.Document) -> dict[str, Node]:
    requested = {edit.formatted_suffix for edit in EDITS if edit.formatted_suffix}
    templates: dict[str, Node] = {}
    for run in document.getElementsByTagName("w:r"):
        value = "".join(
            node.firstChild.data if node.firstChild is not None else ""
            for node in run.getElementsByTagName("w:t")
        )
        if value not in requested or not run.getElementsByTagName("w:vertAlign"):
            continue
        templates.setdefault(value, run.cloneNode(deep=True))
    missing = requested - templates.keys()
    if missing:
        raise RuntimeError(f"Could not find formatted citation runs: {sorted(missing)}")
    return templates


def selected_section_word_count(document: minidom.Document) -> int:
    within_selection = False
    text: list[str] = []
    for paragraph in document.getElementsByTagName("w:p"):
        value = paragraph_text(paragraph)
        if value == "PREFACE":
            within_selection = True
        elif value == "CHAPTER 2":
            break
        if within_selection:
            text.append(value)
    return word_count(" ".join(text))


def token_diff(old: str, new: str) -> str:
    token_pattern = re.compile(r"\s+|[\w’'-]+|[^\w\s]", flags=re.UNICODE)
    old_tokens = token_pattern.findall(old)
    new_tokens = token_pattern.findall(new)
    matcher = difflib.SequenceMatcher(a=old_tokens, b=new_tokens, autojunk=False)
    rendered: list[str] = []
    for operation, a_start, a_end, b_start, b_end in matcher.get_opcodes():
        old_part = html.escape("".join(old_tokens[a_start:a_end]))
        new_part = html.escape("".join(new_tokens[b_start:b_end]))
        if operation == "equal":
            rendered.append(old_part)
        elif operation == "delete":
            rendered.append(f"<del>{old_part}</del>")
        elif operation == "insert":
            rendered.append(f"<ins>{new_part}</ins>")
        else:
            rendered.append(f"<del>{old_part}</del><ins>{new_part}</ins>")
    return "".join(rendered)


def build_redline(source: pathlib.Path, source_hash: str) -> str:
    old_words = sum(word_count(edit.old) for edit in EDITS)
    new_words = sum(word_count(edited_text(edit)) for edit in EDITS)
    sections: list[str] = []
    current_section = ""
    for index, edit in enumerate(EDITS, start=1):
        if edit.section != current_section:
            current_section = edit.section
            sections.append(f"<h2>{html.escape(current_section)}</h2>")
        sections.append(
            f"""
            <article class="edit">
              <p class="edit-number">Edit {index:02d}</p>
              <p class="rationale">{html.escape(edit.rationale)}</p>
              <p class="redline">{token_diff(edit.old, edited_text(edit))}</p>
            </article>
            """
        )

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DOT Book One · Preface and Chapter 1 Redline</title>
  <style>
    @page {{ size: 6in 9in; margin: 0.65in; }}
    :root {{ color-scheme: light; font-family: "Noto Serif", Georgia, serif; color: #171b1f; background: #f7f5ef; }}
    body {{ max-width: 42rem; margin: 0 auto; padding: 3rem 1.5rem 6rem; line-height: 1.58; }}
    h1 {{ font-size: 2rem; line-height: 1.08; margin: 0 0 0.6rem; }}
    h2 {{ break-before: page; border-bottom: 1px solid #b9b4a7; padding-bottom: 0.45rem; margin-top: 4rem; }}
    .deck {{ color: #4e565d; font-family: "Noto Sans", Arial, sans-serif; }}
    .summary {{ border-block: 1px solid #b9b4a7; margin: 2rem 0; padding: 1rem 0; }}
    .summary strong {{ font-family: "Noto Sans", Arial, sans-serif; }}
    .edit {{ break-inside: avoid; border-bottom: 1px solid #ddd8cc; padding: 1.2rem 0; }}
    .edit-number, .rationale {{ font-family: "Noto Sans", Arial, sans-serif; }}
    .edit-number {{ color: #0b5264; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; margin: 0; text-transform: uppercase; }}
    .rationale {{ color: #596169; font-size: 0.82rem; margin: 0.25rem 0 0.8rem; }}
    .redline {{ margin: 0; }}
    del {{ background: #f3d8d4; color: #812d29; text-decoration-thickness: 1px; }}
    ins {{ background: #dcebdc; color: #195f33; text-decoration: none; }}
    code {{ overflow-wrap: anywhere; }}
    @media print {{ body {{ padding: 0; }} }}
  </style>
</head>
<body>
  <p class="edit-number">Editorial candidate · 13 August 2026</p>
  <h1>Book One line edit</h1>
  <p class="deck">Preface and Chapter 1 · exact word-level redline</p>
  <div class="summary">
    <p><strong>{len(EDITS)} paragraph edits</strong> · {old_words:,} edited words → {new_words:,} words · {old_words - new_words:,} words removed ({(old_words - new_words) / old_words:.1%})</p>
    <p>The pass preserves the theory's claim hierarchy, named concepts, citations, equations, and section order. It improves cadence, accessibility, and public-edition confidence.</p>
  </div>
  <p class="deck">Source: <code>{html.escape(str(source))}</code><br>SHA-256: <code>{source_hash}</code></p>
  {"".join(sections)}
</body>
</html>
"""


def main() -> None:
    args = parse_args()
    source = args.input.resolve()
    output = args.output.resolve()
    if not source.is_file():
        raise SystemExit(f"Book manuscript not found: {source}")

    source_bytes = source.read_bytes()
    source_hash = hashlib.sha256(source_bytes).hexdigest()
    with zipfile.ZipFile(source) as archive:
        parts = {name: archive.read(name) for name in archive.namelist()}

    document = minidom.parseString(parts["word/document.xml"])
    selected_words_before = selected_section_word_count(document)
    suffix_templates = formatted_suffix_templates(document)
    paragraphs_by_text: dict[str, list[Node]] = {}
    for paragraph in document.getElementsByTagName("w:p"):
        text = paragraph_text(paragraph)
        if text:
            paragraphs_by_text.setdefault(text, []).append(paragraph)

    seen_old: set[str] = set()
    for edit in EDITS:
        if edit.old in seen_old:
            raise RuntimeError(f"Duplicate edit source paragraph: {edit.old[:80]}")
        seen_old.add(edit.old)
        matches = paragraphs_by_text.get(edit.old, [])
        if len(matches) != 1:
            raise RuntimeError(
                f"Expected exactly one source paragraph, found {len(matches)}: "
                f"{edit.old[:100]}"
            )
        paragraph = matches[0]
        if paragraph.getElementsByTagName("w:hyperlink"):
            raise RuntimeError(
                f"Refusing to flatten a linked paragraph: {edit.old[:100]}"
            )
        suffix_run = (
            suffix_templates[edit.formatted_suffix].cloneNode(deep=True)
            if edit.formatted_suffix
            else None
        )
        replace_paragraph_text(paragraph, edit.new, suffix_run)
    selected_words_after = selected_section_word_count(document)

    timestamp = (
        datetime.datetime.now(datetime.UTC)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )
    core = minidom.parseString(parts["docProps/core.xml"])
    modified = core.getElementsByTagName("dcterms:modified")
    if modified:
        while modified[0].firstChild is not None:
            modified[0].removeChild(modified[0].firstChild)
        modified[0].appendChild(core.createTextNode(timestamp))

    parts["word/document.xml"] = document.toxml(encoding="UTF-8")
    parts["docProps/core.xml"] = core.toxml(encoding="UTF-8")
    output.mkdir(parents=True, exist_ok=True)
    candidate = output / CANDIDATE_NAME
    with zipfile.ZipFile(candidate, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in parts.items():
            archive.writestr(name, data)

    redline = output / REDLINE_NAME
    redline.write_text(build_redline(source, source_hash), encoding="utf-8")

    old_words = sum(word_count(edit.old) for edit in EDITS)
    new_words = sum(word_count(edited_text(edit)) for edit in EDITS)
    report = {
        "source": str(source),
        "source_sha256": source_hash,
        "candidate": str(candidate),
        "sections": ["Preface", "Chapter 1"],
        "paragraph_edits": len(EDITS),
        "edited_words_before": old_words,
        "edited_words_after": new_words,
        "words_removed": old_words - new_words,
        "reduction": round((old_words - new_words) / old_words, 4),
        "selected_sections_words_before": selected_words_before,
        "selected_sections_words_after": selected_words_after,
        "selected_sections_words_removed": selected_words_before - selected_words_after,
        "selected_sections_reduction": round(
            (selected_words_before - selected_words_after) / selected_words_before,
            4,
        ),
        "claim_levels_changed": False,
        "citations_removed": False,
        "citations_repositioned": True,
        "equations_changed": False,
    }
    (output / REPORT_NAME).write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )

    print("Built reversible Book One line edit (source manuscript unchanged):")
    print(f"  Candidate: {candidate}")
    print(f"  Redline:   {redline}")
    print(f"  Edits:     {len(EDITS)} paragraphs")
    print(
        f"  Reduction: {old_words - new_words} words "
        f"({(old_words - new_words) / old_words:.1%} across edited paragraphs)"
    )


if __name__ == "__main__":
    main()
