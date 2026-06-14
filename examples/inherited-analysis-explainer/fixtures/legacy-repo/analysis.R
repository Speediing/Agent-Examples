# STUDY-042 exploratory RNA-seq analysis
source("config.yaml")

counts <- read.csv(config$counts_path)
metadata <- read.csv(config$metadata_path)

filtered <- subset(counts, rowSums(counts[, -1]) >= config$min_total_reads)
write.csv(filtered, "output/filtered-counts.csv", row.names = FALSE)
