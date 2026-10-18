// ============================================================================
// DART / FLUTTER DATA MODELS : OUEDKNISS SUPABASE ENTITIES
// Strict 1:1 column-by-column alignment with 001_ouedkniss.sql & ouedknissSchema.ts
// UTF-8 preservation for Arabic and French, nullable-safe, zero fake data
// ============================================================================

import 'dart:convert';

/// Source d'extraction du contact
enum SellerContactSource {
  announcement_graphql,
  user_graphql,
  store_graphql,
  description_regex,
}

SellerContactSource parseContactSource(String? value) {
  switch (value) {
    case 'user_graphql':
      return SellerContactSource.user_graphql;
    case 'store_graphql':
      return SellerContactSource.store_graphql;
    case 'description_regex':
      return SellerContactSource.description_regex;
    case 'announcement_graphql':
    default:
      return SellerContactSource.announcement_graphql;
  }
}

class SellerPhone {
  final String number;
  final bool hasWhatsapp;
  final bool hasViber;
  final SellerContactSource source;

  const SellerPhone({
    required this.number,
    this.hasWhatsapp = false,
    this.hasViber = false,
    this.source = SellerContactSource.announcement_graphql,
  });

  factory SellerPhone.fromJson(Map<String, dynamic> json) {
    return SellerPhone(
      number: json['number'] as String? ?? '',
      hasWhatsapp: json['has_whatsapp'] as bool? ?? false,
      hasViber: json['has_viber'] as bool? ?? false,
      source: parseContactSource(json['source'] as String?),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'number': number,
      'has_whatsapp': hasWhatsapp,
      'has_viber': hasViber,
      'source': source.name,
    };
  }
}

class CategoryModel {
  final String slug;
  final String nameFr;
  final String nameAr;
  final String? parentSlug;
  final String? icon;
  final int siteCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const CategoryModel({
    required this.slug,
    required this.nameFr,
    required this.nameAr,
    this.parentSlug,
    this.icon,
    this.siteCount = 0,
    this.createdAt,
    this.updatedAt,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      slug: json['slug'] as String,
      nameFr: json['name_fr'] as String,
      nameAr: json['name_ar'] as String,
      parentSlug: json['parent_slug'] as String?,
      icon: json['icon'] as String?,
      siteCount: json['site_count'] as int? ?? 0,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'slug': slug,
      'name_fr': nameFr,
      'name_ar': nameAr,
      'parent_slug': parentSlug,
      'icon': icon,
      'site_count': siteCount,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updated_at': updatedAt!.toIso8601String(),
    };
  }
}

class SellerModel {
  final String id;
  final String sourceId;
  final String type; // 'user' | 'store' | 'unknown'
  final String? name;
  final String? storeSlug;
  final String? profileUrl;
  final String? wilaya;
  final String? commune;
  final String? address;
  final List<String>? emails;
  final List<SellerPhone> phones;
  final String contactsStatus; // 'ok' | 'none' | 'failed'
  final Map<String, dynamic>? raw;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const SellerModel({
    required this.id,
    required this.sourceId,
    this.type = 'unknown',
    this.name,
    this.storeSlug,
    this.profileUrl,
    this.wilaya,
    this.commune,
    this.address,
    this.emails,
    this.phones = const [],
    this.contactsStatus = 'ok',
    this.raw,
    this.createdAt,
    this.updatedAt,
  });

  factory SellerModel.fromJson(Map<String, dynamic> json) {
    var rawPhones = json['phones'];
    List<SellerPhone> parsedPhones = [];
    if (rawPhones is List) {
      parsedPhones = rawPhones.map((p) => SellerPhone.fromJson(p as Map<String, dynamic>)).toList();
    }

    var rawEmails = json['emails'];
    List<String>? parsedEmails;
    if (rawEmails is List) {
      parsedEmails = rawEmails.map((e) => e.toString()).toList();
    }

    return SellerModel(
      id: json['id'] as String,
      sourceId: json['source_id'] as String,
      type: json['type'] as String? ?? 'unknown',
      name: json['name'] as String?,
      storeSlug: json['store_slug'] as String?,
      profileUrl: json['profile_url'] as String?,
      wilaya: json['wilaya'] as String?,
      commune: json['commune'] as String?,
      address: json['address'] as String?,
      emails: parsedEmails,
      phones: parsedPhones,
      contactsStatus: json['contacts_status'] as String? ?? 'ok',
      raw: json['raw'] as Map<String, dynamic>?,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'source_id': sourceId,
      'type': type,
      'name': name,
      'store_slug': storeSlug,
      'profile_url': profileUrl,
      'wilaya': wilaya,
      'commune': commune,
      'address': address,
      'emails': emails,
      'phones': phones.map((p) => p.toJson()).toList(),
      'contacts_status': contactsStatus,
      'raw': raw,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updated_at': updatedAt!.toIso8601String(),
    };
  }
}

class ListingModel {
  final String id;
  final String sourceId;
  final String url;
  final String urlEncoded;
  final String title;
  final String? description;
  final double? price;
  final String? priceRaw;
  final String? priceUnit;
  final String currency;
  final bool? negotiable;
  final String? categoryId;
  final String? sellerId;
  final String? region;
  final String? city;
  final DateTime? publishedAt;
  final DateTime? refreshedAt;
  final bool isStore;
  final bool isPromo;
  final bool isFlash;
  final bool isSponsored;
  final bool isUrgent;
  final Map<String, dynamic> specs;
  final Map<String, dynamic>? raw;
  final DateTime scrapedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const ListingModel({
    required this.id,
    required this.sourceId,
    required this.url,
    required this.urlEncoded,
    required this.title,
    this.description,
    this.price,
    this.priceRaw,
    this.priceUnit,
    this.currency = 'DA',
    this.negotiable,
    this.categoryId,
    this.sellerId,
    this.region,
    this.city,
    this.publishedAt,
    this.refreshedAt,
    this.isStore = false,
    this.isPromo = false,
    this.isFlash = false,
    this.isSponsored = false,
    this.isUrgent = false,
    this.specs = const {},
    this.raw,
    required this.scrapedAt,
    this.createdAt,
    this.updatedAt,
  });

  factory ListingModel.fromJson(Map<String, dynamic> json) {
    return ListingModel(
      id: json['id'] as String,
      sourceId: json['source_id'] as String,
      url: json['url'] as String,
      urlEncoded: json['url_encoded'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      price: json['price'] != null ? (json['price'] as num).toDouble() : null,
      priceRaw: json['price_raw'] as String?,
      priceUnit: json['price_unit'] as String?,
      currency: json['currency'] as String? ?? 'DA',
      negotiable: json['negotiable'] as bool?,
      categoryId: json['category_id'] as String?,
      sellerId: json['seller_id'] as String?,
      region: json['region'] as String?,
      city: json['city'] as String?,
      publishedAt: json['published_at'] != null ? DateTime.parse(json['published_at'] as String) : null,
      refreshedAt: json['refreshed_at'] != null ? DateTime.parse(json['refreshed_at'] as String) : null,
      isStore: json['is_store'] as bool? ?? false,
      isPromo: json['is_promo'] as bool? ?? false,
      isFlash: json['is_flash'] as bool? ?? false,
      isSponsored: json['is_sponsored'] as bool? ?? false,
      isUrgent: json['is_urgent'] as bool? ?? false,
      specs: json['specs'] as Map<String, dynamic>? ?? {},
      raw: json['raw'] as Map<String, dynamic>?,
      scrapedAt: json['scraped_at'] != null ? DateTime.parse(json['scraped_at'] as String) : DateTime.now(),
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'source_id': sourceId,
      'url': url,
      'url_encoded': urlEncoded,
      'title': title,
      'description': description,
      'price': price,
      'price_raw': priceRaw,
      'price_unit': priceUnit,
      'currency': currency,
      'negotiable': negotiable,
      'category_id': categoryId,
      'seller_id': sellerId,
      'region': region,
      'city': city,
      if (publishedAt != null) 'published_at': publishedAt!.toIso8601String(),
      if (refreshedAt != null) 'refreshed_at': refreshedAt!.toIso8601String(),
      'is_store': isStore,
      'is_promo': isPromo,
      'is_flash': isFlash,
      'is_sponsored': isSponsored,
      'is_urgent': isUrgent,
      'specs': specs,
      'raw': raw,
      'scraped_at': scrapedAt.toIso8601String(),
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updated_at': updatedAt!.toIso8601String(),
    };
  }
}

class ListingImageModel {
  final String id;
  final String listingId;
  final String url;
  final int position;
  final DateTime? verifiedAt;
  final bool isBroken;
  final DateTime? createdAt;

  const ListingImageModel({
    required this.id,
    required this.listingId,
    required this.url,
    this.position = 0,
    this.verifiedAt,
    this.isBroken = false,
    this.createdAt,
  });

  factory ListingImageModel.fromJson(Map<String, dynamic> json) {
    return ListingImageModel(
      id: json['id'] as String,
      listingId: json['listing_id'] as String,
      url: json['url'] as String,
      position: json['position'] as int? ?? 0,
      verifiedAt: json['verified_at'] != null ? DateTime.parse(json['verified_at'] as String) : null,
      isBroken: json['is_broken'] as bool? ?? false,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'listing_id': listingId,
      'url': url,
      'position': position,
      if (verifiedAt != null) 'verified_at': verifiedAt!.toIso8601String(),
      'is_broken': isBroken,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
    };
  }
}
