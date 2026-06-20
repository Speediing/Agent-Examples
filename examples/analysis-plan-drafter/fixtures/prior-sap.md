# Prior statistical analysis plan (excerpt)

## Primary endpoint
Change in expression of GAPDH between treatment arms at week 12.

## Analysis population
Intent-to-treat: all randomized participants with a baseline and at least one post-baseline assay.

## Methods
- Normalize counts with DESeq2.
- Filter genes with fewer than 10 total reads.
- Compare arms with Wald test; FDR threshold 0.05.
