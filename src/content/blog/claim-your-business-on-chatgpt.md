---
title: "How to claim your business on ChatGPT"
description: "You can now claim your business profile in ChatGPT, much like on Google. How it works, and what it doesn't change."
metaTitle: "How to Claim Your Business on ChatGPT (Step by Step)"
metaDescription: "Claim and verify your business in ChatGPT's Business Hub. See who can claim, the verification steps, what you can edit and what it won't do. Read the guide."
pubDate: 2026-11-12
tags: ["SEO", "Local SEO", "AI search"]
cluster: "seo-bootcamp"
related: ["local-seo-checklist-for-service-businesses", "seo-and-geo"]
---

OpenAI has launched Businesses in ChatGPT, a beta that lets a business claim its profile in ChatGPT, prove the business is theirs, and correct the details in it. It went live on 10 November 2026 and runs through a new section of ChatGPT called Business Hub.

If you have claimed a Google Business Profile before, the idea will be familiar. A few details are different enough to know before you start.

## What is Businesses in ChatGPT?

It is OpenAI's business profile system for ChatGPT. ChatGPT already holds profiles for many businesses, built from public sources, and a profile stays visible whether or not its owner claims it. Claiming lets you correct the details and see how often ChatGPT mentions you.

OpenAI's own page for it is [Businesses in ChatGPT](https://openai.com/business/businesses-in-chatgpt/).

## How does it compare with Google Business Profile?

The comparison is fair. In both, a listing exists whether or not you claim it, you prove the business is yours, and then you control the details. BrightLocal describes Business Hub as [OpenAI's version of Google Business Profile](https://www.brightlocal.com/learn/chatgpt-business-hub/), with some Search Console-style reporting added.

Three things work differently:

- **It is one source among several.** BrightLocal's research found that Google's AI Overviews and AI Mode used Google Business Profile as a source for almost every business, while ChatGPT drew on Yelp, directories and company websites. A claimed ChatGPT profile does not replace those sources, so fixing it does not fix what the rest of the web says about you.
- **The reporting is thin.** You get mentions, clicks and topics. You do not see the prompts behind them, and OpenAI says it does not share users' chats with businesses.
- **Editing sits behind an identity check.** Proving you control the business is the first step. Before you can change anything, you also pass an ID check run by a third party called Persona.

## Who can claim a profile?

OpenAI says any eligible business in a place where ChatGPT is available can claim a profile, and that availability depends on the business's location and type. Claiming is free during the beta, and it does not need an ads account or a paid ChatGPT plan.

The limits that matter most for local businesses:

- Physical stores and restaurants can currently claim only an existing US listing.
- Online businesses can claim wherever ChatGPT is available.
- Business Agents, covered below, are limited to eligible online shops and online service businesses in the US.

In practice, a physical business outside the US cannot claim a local listing yet.

## Before you start

- **Check whether you are already listed.** Search for your business in Business Hub first. Access is rolling out gradually, so you may land on a waitlist instead of the claim flow.
- **Make your details match.** Name, address, phone number and hours should be identical on your website, your `LocalBusiness` structured data, your Google Business Profile and the directories that matter. It is the same job as in the [local SEO checklist](/blog/local-seo-checklist-for-service-businesses/). One early tester reports that the name and address must match your official business records for the identity check.
- **Know who controls your DNS.** Domain verification uses a TXT record, so you need access to wherever your DNS is managed.
- **Use an account the business owns.** Whoever holds the claim controls the profile. If an agency or freelancer does the setup, the claim should still sit on an account that belongs to the business.
- **Make sure OpenAI's crawler can reach your site.** A robots.txt file is not the only thing that blocks a crawler. A CDN or firewall rule can return a 403 on its own, and nothing on your pages will tell you. OAI-SearchBot is OpenAI's search crawler.

## How to claim your business on ChatGPT

1. **Open Business Hub.** Sign in to ChatGPT and go to [chatgpt.com/business-hub](https://chatgpt.com/business-hub). Use the ChatGPT account you want to manage the profile from.
2. **Find your business.** Search by name and select the listing. If you are an online business and you are not listed, you can create a profile instead.
3. **Choose a verification method.** Business Hub shows only the methods that fit your listing: a code sent to the business phone or email, a DNS TXT record on your domain, or connecting your Shopify store.
4. **Enter the code or add the record, then verify.** The TXT record is time-limited, so add it and verify straight away. If your DNS provider adds your domain to the end of the record name automatically, enter only the part before it. Otherwise the record ends up with your domain twice.
5. **Wait for approval.** OpenAI reviews the claim and emails you its decision. No review time is stated, and at least one early tester was still waiting when they wrote up the process.
6. **Pass the identity check.** After approval you verify through Persona, which may ask for a government ID, business registration documents and proof that you can act for the business. Until you pass, almost nothing in the profile is editable.

Once you are through, the profile gets a blue verified check.

## What you can change once you are verified

Verified owners can update the website, description, category, logo, cover photo, and delivery and return policies. Businesses that sell products can upload a product feed with prices and stock. One early report says OpenAI reviews each change before it goes live, so edits may not be instant.

## What is a Business Agent?

A Business Agent is a separate feature: a chatbot inside ChatGPT that answers customer questions using the business's own product details and policies. It is limited to eligible online shops and online service businesses in the US. OpenAI's rules say an agent must say it is AI, must not pressure customers, and cannot complete a purchase without the customer's explicit approval. You do not need one to claim a profile.

## What the analytics show

Business Hub reports mentions, website clicks, profile views and the topics people were asking about when your business came up, for the last 7 or 28 days. For an online business, a mention counts when ChatGPT references your website, and the brand name alone does not count. For a local business, it counts when ChatGPT shows your location.

Read the numbers carefully:

- **Clicks are not visits.** The dashboard itself says clicks do not confirm website visits or conversions.
- **A blank is not a zero.** Figures only appear once enough conversations have built up.
- **You cannot see the prompts.** The numbers come from conversations you cannot read.

## What claiming does not do

- **It does not guarantee placement or sales.** OpenAI says so, and says paying for ads does not change how often ChatGPT recommends a business.
- **It does not override other sources.** ChatGPT can still draw on websites and directories when it talks about you.
- **It is not final.** This is a beta. Claiming is free for now, and OpenAI has not ruled out charging later.
- **It is per location.** Each brand and location is claimed separately, with no parent-company view.
- **It may not be reversible.** One early tester reports that OpenAI Support cannot unpublish a profile once it is live, so check the details before you submit them.

## The short version

Claim it if you are eligible, because a profile you did not write is already being shown. Fix the facts, verify, and then watch the numbers for a few weeks before deciding how much it matters.

OpenAI says claiming does not guarantee placement. What helps ChatGPT describe you correctly is the same as ever: consistent details, a clear website, and sources that agree with each other. That is the point of [SEO and GEO being the same fundamentals](/blog/seo-and-geo/).

Details are as of 12 November 2026.

## Sources

- [Businesses in ChatGPT](https://openai.com/business/businesses-in-chatgpt/), OpenAI
- [OpenAI lets businesses claim ChatGPT profiles and launch their own agents](https://thenextweb.com/news/openai-businesses-in-chatgpt-business-agents), The Next Web
- [ChatGPT launches Business Hub](https://www.brightlocal.com/learn/chatgpt-business-hub/), BrightLocal
- [Businesses in ChatGPT: How to Claim, Verify and Measure Your Profile](https://promptwatch.com/blog/businesses-in-chatgpt), Promptwatch
- [OpenAI's Business Hub lets you manage your business in ChatGPT](https://tech-ish.com/2026/11/11/openais-business-hub-lets-you-manage-your-business-in-chatgpt/), tech-ish
